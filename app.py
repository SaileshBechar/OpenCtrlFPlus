import itertools
from flask import Flask, Response, abort, request, jsonify
import os
import openai
import numpy as np
from openai.embeddings_utils import get_embedding, cosine_similarity
import stripe
from keys import openai_key, webhook_secret
import time
from flask_cors import cross_origin
from create_embedding_index import (
    index_pdf_with_thread,
)
from create_embedding_index import MAX_OPENAI_CALLS_PER_MIN
from gotrue import SyncGoTrueClient
import json
import base64
from supabase_utils import (
    user_match_page_summaries,
    admin_update_profile_key,
    authenticate_user,
    add_task_to_queue,
    execute_tasks_in_queue,
    get_pdfs,
    set_chat_history_with_system,
    get_chat_history,
    update_chat_history
)
from prompts import *
import multiprocessing
from summarize import estimate_token_count, summarize_large_text
from parse_pdf import summarize_large_text_parallel

openai.api_key = openai_key
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
DEFAULT_SEARCH_INDEX = "index"
app = Flask(__name__)

GPT4 = True

def custom_decode_jwt_payload(self, token: str):
    _, payload, _ = token.split(".")
    payload += "=" * (-len(payload) % 4)
    payload = base64.urlsafe_b64decode(payload)
    return json.loads(payload)


SyncGoTrueClient._decode_jwt = custom_decode_jwt_payload

def generate_from_retrieval(query, result, article, gpt4 = False):
    return result
    print(f"generating from retrieval with {'gpt4' if gpt4 else 'gpt3.5'}...")
    system_prompt = SYSTEM_CALIBRATION_MESSAGE
    title = result['title']
    page = result['page_num']
    system_prompt += f"""page: {title}, page {page}: [[[{article}]]]""" + NEWLINE + NEWLINE
    USER_CALIBRATION_MESSAGE_PREFIX
    response = openai.ChatCompletion.create(
      model="gpt-4" if gpt4 else "gpt-3.5-turbo-0301",
      messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": USER_CALIBRATION_MESSAGE_PREFIX + query},
        ],
      temperature = 0.0
    )
    time.sleep(60/MAX_OPENAI_CALLS_PER_MIN)
    response_content = response.choices[0].message.content
    result["content"] = response_content.replace('$$', '$').replace('\n', '')
    return result


def embed(text):
    time.sleep(60 / MAX_OPENAI_CALLS_PER_MIN)
    return np.array(get_embedding(text, engine="text-embedding-ada-002")).flatten()

@app.route("/")
def hello_world():
        return "Welcome to CtrlF+. This is still under construction."


@app.route('/webhook', methods=['POST'])
def webhook_received():
    # Replace this endpoint secret with your endpoint's unique secret
    # If you are testing with the CLI, find the secret by running 'stripe listen'
    # If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    # at https://dashboard.stripe.com/webhooks
    request_data = json.loads(request.data)
    if webhook_secret:
        # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
        signature = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(
                payload=request.data, sig_header=signature, secret=webhook_secret)
            data = event['data']
        except Exception as e:
            abort(403, e)
        # Get the type of webhook event sent - used to check the status of PaymentIntents.
        event_type = event['type']
    else:
        data = request_data['data']
        event_type = request_data['type']
    data_object = data['object']

    print('event ' + event_type)

    if event_type == 'checkout.session.completed':
        print('🔔 Payment succeeded!', data_object['client_reference_id'])
        # Retrieve price information when payment has succeeded
        subscription = stripe.Subscription.retrieve(
            data_object['subscription'],
        )
        admin_update_profile_key("id",
            data_object['client_reference_id'], "customer_id", data_object['customer'])
        admin_update_profile_key("customer_id",
                                    data_object['customer'], "payment_type", subscription['items']['data'][0]['price']['lookup_key'])
        admin_update_profile_key("customer_id",
                                data_object['customer'], "max_pages", subscription['items']['data'][0]['price']['metadata']['max_pages'])
        admin_update_profile_key("customer_id",
                                 data_object['customer'], "subscription_id", data_object['subscription'])
    elif event_type == 'customer.subscription.trial_will_end':
        print('Subscription trial will end')
    elif event_type == 'customer.subscription.created':
        print('Subscription created %s', event.id)
        admin_update_profile_key("customer_id",
                                 data_object['customer'], "status", data_object['status'])
    elif event_type == 'customer.subscription.updated':
        # This is the last event to fire when signing up
        admin_update_profile_key("customer_id",
                                 data_object['customer'], "status", data_object['status'])
        if (data_object['status'] == "unpaid" or data_object['status'] == "canceled"):
            admin_update_profile_key("customer_id",
                                     data_object['customer'], "payment_type", "free")
        print('Subscription updated %s')
    elif event_type == 'customer.subscription.deleted':
        # handle subscription canceled automatically based
        # upon your subscription settings. Or if the user cancels it.
        admin_update_profile_key("customer_id",
                                 data_object['customer'], "status", data_object['status'])
        admin_update_profile_key("customer_id",
                                 data_object['customer'], "payment_type", "free")
        admin_update_profile_key("customer_id",
                                 data_object['customer'], "subscription_id", "")
        print('Subscription canceled: %s', event.id,
              data_object['customer'])
    elif event_type == "invoice.paid":
        # Reset pages uploaded every month an invoice is paid. Might not work for annual subscriptions
        admin_update_profile_key("customer_id",
                                 data_object['customer'], "pages_uploaded", 0)

    return jsonify({'status': 'success'})

def parse_command(command_string):
    # Split the command string into tokens
    tokens = command_string.split()
    # Extract the arguments
    args = {}
    for i in range(len(tokens)):
        if tokens[i][0:2] == '--':
            arg_name = tokens[i]
            args[arg_name] = tokens[i+1]
    raw_search = command_string.split(' --')[0]
    return raw_search, args

@app.route("/update_profile", methods=["POST"])
@cross_origin()
def update_profile():
    try:
        session, supabase = authenticate_user(
            request.headers.get("Authorization"),
            request.headers.get("Supabase_Refresh")
        )
    except Exception as e:
        print(e)
        abort(403, "Invalid access token")
    data = request.get_json(force=True)
    for key in data:
        admin_update_profile_key("id", session.user.id, key, data[key])
    return jsonify({'status': 'success'})

def parse_command(command_string):
    # Split the command string into tokens
    tokens = command_string.split()
    # Extract the arguments
    args = {}
    for i in range(len(tokens)):
        if tokens[i][0:2] == '--':
            arg_name = tokens[i]
            args[arg_name] = tokens[i+1]
    raw_search = command_string.split(' --')[0]
    return raw_search, args

@app.route("/get_pdf_titles")
@cross_origin()
def get_pdf_titles():
    try:
        session, supabase = authenticate_user(
            request.headers.get("Authorization"),
            request.headers.get("Supabase_Refresh"),
        )
    except Exception as e:
        print(e)
        abort(403, "Invalid access token")
    response = get_pdfs(supabase, session.user.id)
    pdfs = [{'title' : pdf['name'], 'pdf_link' : pdf['link']} for pdf in response]
    return jsonify({"results": pdfs})


filter_map = {'figure':['image'],
                'paragraph':['content', 'subsection', 'section', 'title'],
                'table':['table'],
                'equation': ['equation', 'newline_equation'],
                'references':['references'],
                'author': ['author']}
@app.route("/stream")
@cross_origin()
def stream():
    try:
        session, supabase = authenticate_user(
            request.args.get("my-access-token"),
            request.args.get("my-refresh-token"),
        )
        user_id = session.user.id
    except Exception as e:
        print(e)
        abort(403, "Invalid access token")

    prompt = request.args.get('prompt')

    search_embedding = embed(prompt)   
    results = user_match_page_summaries(supabase=supabase, embedding=search_embedding.tolist(), user_id=session.user.id)
    
    history_row = get_chat_history(user_id)
    if not history_row:
        unique_page_id_dict = {}
        unique_pages = []
        for page in results:
            # Dict should have O(1) lookup
            if not page['page_id'] in unique_page_id_dict:
                if (tc:=estimate_token_count(''.join([p['page_content'] for p in unique_pages]))) > (5000 if GPT4 else 2000): break
                unique_pages.append({"page_number" : page['page_num'], "title" : page['title'], "page_content" : page['summary']})
                unique_page_id_dict[page['page_id']] = True    

        prompt_instruction = f"""You are an expert scientific assistant. Pages is a list of page objects given in triple square brackets that contains a page number, title and page content. Read all of the page contents carefully. After doing so, find the most relevant pieces of information for the user's question, and give that exact information from the pages that contain relevant information. Format the response in Mathpix Markdown, with equations and figures if relevant. Unicode is not supported in MMD. Be very brief in your response. Assume the reader has a graduate level understanding of the topic. Mention the page numbers you retrieved the relevant information from, if any, and title found in the page object at the end of your answer. Pages: [[[{unique_pages}]]]"""
        set_chat_history_with_system(user_id, prompt_instruction)
    chat_history = update_chat_history(user_id, 'user', prompt)['history']['memory']
    # Send the response stream to the frontend as a chunked response
    def generate():
        completion = openai.ChatCompletion.create(
            model= 'gpt-4' if GPT4 else 'gpt-3.5-turbo-0301',
            messages=chat_history,
            temperature=0,
            stream=True
        )

        stream_result = ""
        for message in completion:
            if message == "[DONE]" or message['choices'][0]['finish_reason'] == 'stop':
                terminate_str = "[DONE]"
                update_chat_history(user_id, 'assistant', stream_result)
                yield f"data: {json.dumps(terminate_str)}\n\n"
            else:
                if 'content' in message['choices'][0]['delta']:
                    token = message['choices'][0]['delta']['content']
                    stream_result += token
                    yield f"data: {json.dumps(token)}\n\n"
                else:
                    yield f"data: {json.dumps('')}\n\n"
    return Response(generate(), mimetype='text/event-stream;charset=utf-8', headers={'Access-Control-Allow-Credentials':'true'})


@app.route("/index_new_pdf", methods=["POST"])
@cross_origin()
def index_new_pdf():
    data = request.get_json(force=True)
    try:
        session, supabase = authenticate_user(
            request.headers.get("Authorization"),
            request.headers.get("Supabase_Refresh"),
        )
        user_id = session.user.id
    except Exception as e:
        print(e)
        abort(403, "Invalid access token")
    admin_update_profile_key("id", user_id,"index_status", "Indexing...\n(this may take a few minutes)")
    task_data = {"google_drive_share_link": data["google_drive_share_link"],
                "embedding_index_file": "index", "start_page" : data['startPage'], 'end_page' : data['endPage']}
    print('adding task to queue with response')
    response = add_task_to_queue(user_id, data["title"], task_data, request.headers.get("Authorization"))
    print('done adding task to queue, response', response)
    print('popping from queue')
    execute_tasks_in_queue(app.app_context(), request, index_pdf_with_thread)
    return {"responseCode": 1}, 200

