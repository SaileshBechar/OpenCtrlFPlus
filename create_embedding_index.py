import time
import openai
import numpy as np
from openai.embeddings_utils import get_embedding, cosine_similarity
from keys import openai_key
from supabase_utils import admin_update_pages_uploaded, admin_update_profile_key, admin_upload_page, admin_upload_page_chunk, admin_upload_pdf
openai.api_key = openai_key
from parse_pdf import get_download_url, get_pagecount_from_url, parse_from_google_drive_share_link_multithreadded, parse_from_google_drive_share_link, DELIMETERS, sanitize_custom_pages
MAX_OPENAI_CALLS_PER_MIN = 1000
import time
from supabase_utils import create_client, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from parse_pdf import MAX_MATHPIX_CALLS_PER_MIN
import multiprocessing
import math

def embed(text):
    time.sleep(60/MAX_OPENAI_CALLS_PER_MIN)
    return np.array(get_embedding(text, engine='text-embedding-ada-002')).flatten()

def index_pdf_with_thread(title, google_drive_share_link, user_id, current_pages, max_pages, start_page, end_page, multithread=False, optimized_endpoints = False):
    url = get_download_url(google_drive_share_link)
    print("URL:", url)
    n_pages = get_pagecount_from_url(url)
    start, end = sanitize_custom_pages(n_pages=n_pages, start_page=start_page, end_page=end_page)
    n_pages = end - start + 1
    if n_pages+current_pages > max_pages:
        admin_update_profile_key("id", user_id,"index_status", f"INDEXING FAILED\n PDF will exceed page limit. Try again with {max_pages - current_pages} pages or fewer.")
        return -1
    responseCode = create_embedding_index_from_google_drive_share_link(title, google_drive_share_link, user_id, start, end, multithread, optimized_endpoints=optimized_endpoints)
    if responseCode > 0: # success
        response = admin_update_pages_uploaded(user_id, responseCode)
        admin_update_profile_key("id", user_id,"index_status", "Upload successful")
        return {"pages_uploaded": response.data[0]["pages_uploaded"]}, 200
    else:
        admin_update_profile_key("id", user_id,"index_status", f"INDEXING FAILED: (error code {responseCode})")
        print("id", user_id,"index_status", f"INDEXING FAILED: (error code {responseCode})")

def create_embedding_index_from_parse(parse, page_id):
    unique_types = list(set(DELIMETERS.keys()))
    all_chunks = '.'.join([chunk for i, chunk in parse["content"]])
    for type in unique_types:
        for i, chunk in parse[type]:
            text_to_embed = chunk
            if text_to_embed is not None and text_to_embed.replace('\n','').strip() != '':
                if text_to_embed[0:4] == "![](":
                    embedding = embed(all_chunks)
                else:
                    embedding = embed(text_to_embed)
            else:
                embedding = None
            if embedding is not None:
                admin_upload_page_chunk(content=chunk, page_id=page_id, embedding=embedding.tolist(), type=type)

def create_page_embedding(pagenum, parses, summaries, pdf_id, start_page):
    print(pagenum, parses)
    page_id = admin_upload_page(pdf_id=pdf_id, page_number=pagenum, summary=summaries[pagenum-start_page])
    create_embedding_index_from_parse(parses[pagenum-start_page], page_id)

def create_embedding_index_from_parses_multithreadded(parses, summaries, pdf_id, user_id, start_page, end_page):
    n_pages = end_page - start_page + 1
    n_procs = min(n_pages, MAX_MATHPIX_CALLS_PER_MIN)
    args = [(pagenum, parses, summaries, pdf_id, start_page) for pagenum in range(start_page, end_page + 1)]
    n_batches = math.ceil(n_pages / n_procs)
    start_time = time.time()
    a = 0
    b = min(n_pages, a + n_procs)
    for batch in range(n_batches):
        admin_update_profile_key("id", user_id, "index_status", f'Embedding pages {a} to {b}')
        with multiprocessing.Pool(processes=n_procs) as pool:
            a = batch * n_procs
            b = min(n_pages, a + n_procs)
            print(args)
            pool.starmap(create_page_embedding, args[a:b])
        batch_end_time = time.time()
        total_time_elapsed = batch_end_time - start_time
        avg_batch_time = total_time_elapsed / (batch + 1)
        remaining_batches = n_batches - (batch + 1)
        estimated_remaining_time = remaining_batches * avg_batch_time
        admin_update_profile_key("id", user_id, "index_status",
                                 f"Embedding: estimated {estimated_remaining_time/60:.2f} minutes remaining")
    admin_update_profile_key("id", user_id, "index_status", 'Done embedding')

def create_embedding_index_from_google_drive_share_link(title, google_drive_share_link, user_id, start_page, end_page, multithread = False, optimized_endpoints = False):
    pdf_id = admin_upload_pdf(user_id, title, google_drive_share_link)
    if multithread:
        parses, summaries = parse_from_google_drive_share_link_multithreadded(google_drive_share_link, user_id=user_id, start_page=start_page, end_page=end_page, pdf_id=pdf_id, optimized_endpoints=optimized_endpoints) # this function costs a lot of money to run
    else:
        parses, summaries = parse_from_google_drive_share_link(google_drive_share_link, start_page=start_page, end_page=end_page, pdf_id=pdf_id) # this function costs a lot of money to run
    if parses:
        print('creating embedding')
        create_embedding_index_from_parses_multithreadded(parses, summaries, pdf_id, user_id, start_page, end_page)
        print('uploading to bucket')
    return 1
