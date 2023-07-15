from supabase_utils import admin_update_profile_key, get_payment_type, admin_update_pdf_id, admin_update_profile_key
from summarize import summarize_large_text
import re
from flask import request
import requests
import time
import PyPDF2
import os
import unicodedata
from keys import mathpix_app_id, mathpix_app_key, openai_key
import openai
from openai.embeddings_utils import get_embedding
import multiprocessing
import math
from pdf2image import convert_from_path
import json
from prompts import *
import pytesseract
from PIL import Image
openai.api_key = openai_key
import numpy as np

MAX_OPENAI_CALLS_PER_MIN = 1000
MAX_MATHPIX_CALLS_PER_MIN = 16

PDF_ID_FILE = "pdf_ids.pkl"
PARSE_FOLDER = "parses/"

DELIMETERS = {
    "content": [None, None],
    "title": ["\\title{", "}"],
    "author": ["\\author{", "}"],
    "section": ["\\section{", "}"],
    "subsection": ["\\subsection{", "}"],
    "subsubsection": ["\\subsubsection{", "}"],
    "table": ["\\begin{tabular}", "\\end{tabular}"],
    "equation": ["$$", "$$"],
    "newline_equation": ["\n$", "$\n"],
    "references": ["\\section{References}", None],
    "image": ["![](", ")"],
}

# this function costs a lot of money to run
def get_mmd_from_pdf_endpoint(google_drive_share_link, pagenum, n_procs, pdf_id):
    pdf_page_hash = hash_from_google_drive_share_link_and_pagenum(google_drive_share_link, pagenum)
    if os.path.exists(PARSE_FOLDER + pdf_page_hash + ".mmd"):
        return get_mmd_from_pdf_hash(pdf_page_hash)
    url = get_download_url(google_drive_share_link)
    headers = {
        "app_id": mathpix_app_id,
        "app_key": mathpix_app_key,
        "Content-type": "application/json",
    }
    r = requests.post(
        "https://api.mathpix.com/v3/pdf",
        json={
            "url": url,
            "conversion_formats": {"mmd": True},
            "math_inline_delimiters": ["$", "$"],
            "math_display_delimiters": ["$$", "$$"],
            "page_ranges": f"{pagenum}",
        },
        headers=headers,
    )
    # save mathpix pdfid database
    mathpix_id = r.json()["pdf_id"]
    admin_update_pdf_id(pdf_id=pdf_id, mathpix_id=mathpix_id)

    processed_url = "https://api.mathpix.com/v3/pdf/" + mathpix_id + ".mmd"
    response = requests.get(processed_url, headers=headers)
    while "[200]" not in str(response):
        response = requests.get(processed_url, headers=headers)
        print('waiting 2', response)
        time.sleep(n_procs*60/MAX_MATHPIX_CALLS_PER_MIN)
    # clean result to unicode error (normalize text and remove all special characters)
    clean_string = (
        unicodedata.normalize("NFKD", response.text)
        .encode("ASCII", "ignore")
        .decode("utf-8", "ignore")
    )
    return clean_string
        
def download_pdf(url, local_file_name):
    session = requests.Session()
    response = session.get(url)
    # Extract confirmation token from the warning page
    token_pattern = re.compile(r'confirm=([0-9A-Za-z]+)&amp;')
    token_match = token_pattern.search(response.text)
    if token_match:
        token = token_match.group(1)
        # Update the URL with the confirmation token and download the file
        url_with_token = f"{url}&confirm={token}"
        response = session.get(url_with_token)
    with open(local_file_name, "wb") as f:
        f.write(response.content)


def generate_formatted_page(clean_string):
    response = openai.ChatCompletion.create(
      model="gpt-3.5-turbo-0301",
      messages=[
            {"role": "system", "content": MMD_FORMATTING_SYSTEM_CALIBRATION_MESSAGE(clean_string)},
        ],
      temperature = 0.0
    )
    time.sleep(60/MAX_OPENAI_CALLS_PER_MIN)
    response_content = response.choices[0].message.content
    try:
        if 'as an ai language model' in response_content: return ''
        gpt_filtered_mmd = response_content.split('[[[')[1].split(']]]')[0]
        return gpt_filtered_mmd
    except:
        print('GPT failed to filter MMD:', response_content)
        return ''

def generate_improved_ocr_page(clean_string):
    response = openai.ChatCompletion.create(
      model="gpt-3.5-turbo-0301",
      messages=[
            {"role": "system", "content": FIX_BAD_OCR_SYSTEM_CALIBRATION_MESSAGE(clean_string)},
        ],
      temperature = 0.0
    )
    time.sleep(60/MAX_OPENAI_CALLS_PER_MIN)
    response_content = response.choices[0].message.content
    try:
        gpt_filtered_mmd = response_content.split('[[[')[1].split(']]]')[0]
        return gpt_filtered_mmd
    except:
        print('GPT failed to filter MMD:', response_content)
        return ''

def check_for_figures_gpt(clean_string):
    # Check if we should switch to v3/pdf endpoint if page contains a figure
    figure_response = openai.ChatCompletion.create(
      model="gpt-3.5-turbo-0301",
      messages=[
            {"role": "system", "content": FIGURE_SWITCHER_CALIBRATION_MESSAGE(clean_string)},
        ],
      temperature = 0.0
    )
    time.sleep(60/MAX_OPENAI_CALLS_PER_MIN)
    contains_figure = 'true' in figure_response.choices[0].message.content.lower()
    return contains_figure

def check_for_math_or_tables_gpt(clean_string):
    # Check if we should switch to v3/pdf endpoint if page contains a figure
    figure_response = openai.ChatCompletion.create(
      model="gpt-3.5-turbo-0301",
      messages=[
            {"role": "system", "content": MATH_SWITCHER_CALIBRATION_MESSAGE(clean_string)},
        ],
      temperature = 0.0
    )
    time.sleep(60/MAX_OPENAI_CALLS_PER_MIN)
    contains_math = 'true' in figure_response.choices[0].message.content.lower()
    return contains_math

def run_function(func, *args):
    return func(*args)

# this function costs a bit of money to run
def get_mmd_with_optimized_endpoints(google_drive_share_link, pagenum, n_procs, user_id):
    print('running get_mmd_with_optimized_endpoints, page:', pagenum)
    pdf_page_hash = hash_from_google_drive_share_link_and_pagenum(google_drive_share_link, pagenum)
    if os.path.exists(PARSE_FOLDER + pdf_page_hash + ".mmd"):
        return get_mmd_from_pdf_hash(pdf_page_hash)
    url = get_download_url(google_drive_share_link)
    filename = pdf_page_hash + '.pdf'
    download_pdf(url, filename)
    images = convert_from_path(filename, dpi = 200)
    image_filename = f"pdf_images/{pdf_page_hash}.jpeg"
    images[pagenum-1].save(image_filename, "JPEG")
    def extract_text_from_image(image_path):
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text
    pytesseract_extracted_text = extract_text_from_image(image_filename)
    pytesseract_extracted_text_clean = (
                unicodedata.normalize("NFKD", pytesseract_extracted_text)
                .encode("ASCII", "ignore")
                .decode("utf-8", "ignore")
            )
    print('extracted text:', pytesseract_extracted_text)
    # Replace the original code with the following
    with multiprocessing.Pool() as pool:
        results = pool.starmap(run_function, [(generate_improved_ocr_page, pytesseract_extracted_text_clean),
            (check_for_math_or_tables_gpt, pytesseract_extracted_text_clean),
            (check_for_figures_gpt, pytesseract_extracted_text_clean),
        ])
    # Unpack the results
    pytesseract_fixed_text, contains_math, contains_figure = results
    # Print the results
    print('page', pagenum)
    print('fixed text:', pytesseract_fixed_text)
    print('contains math:', contains_math)
    print('contains figure:', contains_figure)
    is_premium = get_payment_type(user_id) == "basic" # in this context basic is the premium plan
    print('is_premium:', is_premium)
    print('payment_type:', get_payment_type(user_id))
    if is_premium and contains_figure:
        return get_mmd_from_pdf_endpoint(google_drive_share_link, pagenum, n_procs)
    #if not contains_math and not contains_figure:
    #    gpt_filtered_mmd = generate_formatted_page(pytesseract_fixed_text)
    #    return gpt_filtered_mmd
    if contains_math:
        print('sending request with image', image_filename)
        r = requests.post("https://api.mathpix.com/v3/text",
                    files={"file": open(image_filename,"rb")},
                    data={
                    "options_json": json.dumps({
                        "math_inline_delimiters": ["$", "$"],
                        "math_display_delimiters": ["$$", "$$"],
                        "rm_spaces": True
                    })
                    },
                    headers={
                        "app_id": mathpix_app_id,
                        "app_key": mathpix_app_key
                    }
                )
        # clean result to unicode error (normalize text and remove all special characters)
        clean_string = (
                    unicodedata.normalize("NFKD", r.json()['text'])
                    .encode("ASCII", "ignore")
                    .decode("utf-8", "ignore")
                )
        print('got result', clean_string)
        if is_premium:
            # second check for figures with better two-column article OCR
            contains_figure = check_for_figures_gpt(clean_string)
            print(f'contains_figure second check, {contains_figure}')
            if contains_figure:
                return get_mmd_from_pdf_endpoint(google_drive_share_link, pagenum, n_procs)
        gpt_filtered_mmd = generate_formatted_page(clean_string)
        return gpt_filtered_mmd
    else:
        print('generating formatted page...')
        gpt_filtered_mmd = generate_formatted_page(pytesseract_fixed_text)
        return gpt_filtered_mmd

def get_mmd_from_pdf_id(pdf_id):
    processed_url = "https://api.mathpix.com/v3/pdf/" + pdf_id + ".mmd"
    headers = {
        "app_id": mathpix_app_id,
        "app_key": mathpix_app_key,
        "Content-type": "application/json",
    }
    response = requests.get(processed_url, headers=headers)
    while "[200]" not in str(response):
        response = requests.get(processed_url, headers=headers)
        time.sleep(1*60/MAX_MATHPIX_CALLS_PER_MIN)
    return response.text


def get_mmd_from_pdf_hash(pdf_hash):
    with open(PARSE_FOLDER + f"{pdf_hash}.mmd", "r") as f:
        markdown = f.read()
    f.close()
    return markdown


# can't use default python hash() unless we want to change environment variables to set seed
def djb2_hash(string):
    hash_value = 5381
    for char in string:
        hash_value = ((hash_value << 5) + hash_value) + ord(char)
    hash_value = str(hash_value)[::3]  # truncate every 3rd to make hash smaller
    return hash_value

#def get_download_url_from_google_drive_share_link(google_drive_share_link):
#    id = get_file_id_from_google_drive_share_link(google_drive_share_link)
#    return "https://drive.google.com/uc?export=download&id=" + id

def make_id_from_arxiv_url(url: str) -> str:
    filename = url.split("/")[-1]
    safe_filename = re.sub(r'[^a-zA-Z0-9.]+', '_', filename)
    return safe_filename

# https://arxiv.org/abs/2004.07606 --> https://arxiv.org/pdf/2004.07606.pdf
def get_arxiv_url_from_arxiv_link(link: str) -> str:
    return link if '.pdf' in link else (link.replace('/abs/', '/pdf/') + '.pdf')

# google drive share link should look something like https://drive.google.com/file/d/FILE_ID/view
def get_file_id_from_link(link):
    pattern = r"(?<=file/d/)[^/]+"
    match = re.search(pattern, link)
    if match:
        id = match.group(0)
    elif 'arxiv' in link:
        id = make_id_from_arxiv_url(link)
    else:
        print("INDEXING FAILED: No file id found from google drive share link:", link)
    return id

def get_download_url(pdf_link):
    if 'google' in pdf_link:
        id = get_file_id_from_link(pdf_link)
        return "https://drive.google.com/uc?export=download&id=" + id
    elif 'arxiv' in pdf_link:
        if '/abs/' in pdf_link:
            # https://arxiv.org/abs/1505.04597 -> https://arxiv.org/pdf/1505.04597.pdf
            return pdf_link.replace('/abs/', '/pdf/') + '.pdf'
        return pdf_link
    else:
        print("Unknown url format:", pdf_link)

def parse_markdown_by_char(markdown):
    # define our parsing syntax
    current_parse = ""
    parsed = {t: [] for t in set(DELIMETERS.keys())}
    currently_parsing_type = "content"
    curly_counter = 0
    for i, char in enumerate(markdown):
        if char == "{":
            curly_counter += 1
        elif char == "}":
            curly_counter -= 1
        current_parse += char
        for type in set(DELIMETERS.keys()):
            if type != "content":
                a = len(current_parse) - len(DELIMETERS[type][0]) if DELIMETERS[type][0] else None
                b = len(current_parse) - len(DELIMETERS[type][1]) if DELIMETERS[type][1] else None
                if ( currently_parsing_type == "content" and current_parse[a:] == DELIMETERS[type][0] ):
                    if current_parse[:a]:
                        parsed["content"].append(current_parse[:a])
                    current_parse = ""
                    currently_parsing_type = type
                elif ( b and currently_parsing_type == type and current_parse[b:] == DELIMETERS[type][1] ):
                    if curly_counter == 0:
                        parsed[type].append(current_parse[:b])
                        current_parse = ""
                        currently_parsing_type = "content"
            else:
                if current_parse[len(current_parse) - 2 :] == "\n\n":
                    parsed["content"].append(current_parse[:-2])
                    current_parse = ""

            if (i == len(markdown) - 1 and (not DELIMETERS[type][1]) and currently_parsing_type == type ):
                parsed[type].append(current_parse)
    return parsed

def has_inline_equation(s):
    inline_pattern = r"\$[^\s]+\$"
    inline_match = re.search(inline_pattern, s)
    inline_eqn = bool(inline_match)
    return inline_eqn

def has_equation(s):
    return len(s) > 4 and s[:2] == "$$" and s[-2:] == '$$'

def parse_markdown_by_double_newline(markdown):
    parsed = {t: [] for t in set(DELIMETERS.keys())}
    split_markdown = markdown.split('\n\n')
    for chunk_element_number, chunk in enumerate(split_markdown):
        chunk_types = []
        if has_equation(chunk):
            chunk_types.append("equation")
        elif has_inline_equation(chunk):
            chunk_types.append("equation")
            chunk_types.append("content")
        elif chunk[0:4] == "![](" and chunk[-1:] == ")":
            chunk_types.append("image")
        else:
            chunk_types = ["content"]
        for t in chunk_types:
            parsed[t].append((chunk_element_number, chunk))
    return parsed

def remove_non_alphabetic_chars(string):
    new_string = ""
    for char in string:
        if char.isalpha():
            new_string += char
    return new_string


def clean_title(title):
    return remove_non_alphabetic_chars(str(title).lower())

def get_pagecount_from_url(url):
    session = requests.Session()
    response = session.get(url)
    # Extract confirmation token from the warning page
    token_pattern = re.compile(r'confirm=([0-9A-Za-z]+)&amp;')
    token_match = token_pattern.search(response.text)
    if token_match:
        token = token_match.group(1)
        # Update the URL with the confirmation token and download the file
        url_with_token = f"{url}&confirm={token}"
        response = session.get(url_with_token)
    with open(PARSE_FOLDER + "temp.pdf", "wb") as f:
        f.write(response.content)
    pdf_file = open(PARSE_FOLDER + "temp.pdf", "rb")
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    num_pages = len(pdf_reader.pages)
    pdf_file.close()
    os.remove(PARSE_FOLDER + "temp.pdf")
    print("pagecount: ", num_pages)
    return num_pages


def hash_from_google_drive_share_link_and_pagenum(google_drive_share_link, pagenum):
    file_id = get_file_id_from_link(google_drive_share_link)
    return file_id+'_'+str(pagenum)


def parse_from_google_drive_share_link(google_drive_share_link, start_page, end_page, pdf_id):
    parses = []
    summaries = []
    for pagenum in range(start_page, end_page + 1):
        pdf_page_hash = hash_from_google_drive_share_link_and_pagenum(google_drive_share_link, pagenum)
        markdown = get_mmd_from_pdf_endpoint(google_drive_share_link, pagenum, pdf_id=pdf_id)
        parsed = parse_markdown_by_char(markdown)
        parses.append(parsed)
        summary = summarize_large_text(markdown)
        summaries.append(summary)
    return parses, summaries

def sanitize_custom_pages(n_pages, start_page, end_page):
    new_start = 1
    new_end = n_pages
    regex = r"^[0-9]+$"
    if (start_page and re.match(regex, start_page)):
        start_page = int(start_page)
        if (start_page > 0 and start_page <= n_pages):
            new_start = start_page 
    if (end_page and re.match(regex, end_page)):
        end_page = int(end_page)
        if (end_page > 0 and end_page <= n_pages):
            new_end = end_page 
            if (new_start > end_page):
                new_start = 1
    print(f'start page: {new_start}, end page: {new_end}')
    return new_start, new_end

class NoDaemonProcess(multiprocessing.Process):
    # make 'daemon' attribute always return False
    @property
    def daemon(self):
        return False

    @daemon.setter
    def daemon(self, val):
        pass

class NoDaemonProcessPool(multiprocessing.pool.Pool):

    def Process(self, *args, **kwds):
        proc = super(NoDaemonProcessPool, self).Process(*args, **kwds)
        proc.__class__ = NoDaemonProcess

        return proc

def summarize_large_text_parallel(markdowns, n_procs):
    with multiprocessing.Pool(processes=n_procs) as pool:
        summaries = pool.map(summarize_large_text, markdowns)
    return summaries

def parse_from_google_drive_share_link_multithreadded(google_drive_share_link, user_id, start_page, end_page, pdf_id, optimized_endpoints = False):
    n_pages = end_page - start_page + 1
    n_procs = min(n_pages, MAX_MATHPIX_CALLS_PER_MIN)
    args = [(google_drive_share_link, pagenum, n_procs, pdf_id) for pagenum in range(start_page, end_page + 1)]
    markdowns = []
    n_batches = math.ceil(end_page / n_procs)
    start_time = time.time()
    for batch in range(n_batches):
        with NoDaemonProcessPool(n_procs) as pool:
            a = batch * n_procs
            b = min(end_page, a + n_procs)
            if optimized_endpoints:
                markdowns += pool.starmap(get_mmd_with_optimized_endpoints, args[a:b])
            else:
                markdowns += pool.starmap(get_mmd_from_pdf_endpoint, args[a:b])
            time.sleep((b-a)*(60/MAX_MATHPIX_CALLS_PER_MIN))
        batch_end_time = time.time()
        total_time_elapsed = batch_end_time - start_time
        avg_batch_time = total_time_elapsed / (batch + 1)
        remaining_batches = n_batches - (batch + 1)
        estimated_remaining_time = remaining_batches * avg_batch_time
        admin_update_profile_key("id", user_id, "index_status",
                                 f"Parsing: estimated {estimated_remaining_time/60:.2f} minutes remaining")
        print('batch done')
        time.sleep(n_procs / MAX_MATHPIX_CALLS_PER_MIN)
    pool.close()
    pool.join()
    admin_update_profile_key("id", user_id,"index_status",'Parse finished')
    parses = []
    summaries = summarize_large_text_parallel(markdowns, n_procs)
    for pagenum, markdown in enumerate(markdowns, start=1):
        parsed = parse_markdown_by_double_newline(markdown)
        print("parses", markdown, parsed)
        parses.append(parsed)
    return parses, summaries
