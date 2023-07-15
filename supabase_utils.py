import os
from flask import abort
from supabase import create_client, Client
import threading

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_STORAGE_BASE_API = '/storage/v1/'


def authenticate_user(auth_bearer, refresh_token):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    access_token = auth_bearer.split(" ")[1]
    session = supabase.auth.set_session(access_token, refresh_token)
    postgrest_client = supabase.postgrest
    postgrest_client.auth(access_token)
    if supabase.table('profiles').select("*").eq('id', session.user.id).execute().data[0]['status'] != "active":
        abort(403, "Subscription not active")
    return session, supabase


def get_profile_key(supabase, user_id, key):
    res = supabase.table('profiles').select("*").eq('id', user_id).execute()
    return res.data[0][key]


def admin_update_pages_uploaded(user_id, pages_uploaded):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    response = supabase.table('profiles').select("*").eq('id', user_id).execute()
    curr_page_count = response.data[0]['pages_uploaded']
    data = supabase.table('profiles').update({"pages_uploaded": curr_page_count + pages_uploaded}).eq('id', user_id).execute()
    return data


def admin_update_profile_key(matchID, user_id, key, val):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    data = supabase.table('profiles').update({key: val}).eq(matchID, user_id).execute()
    return data


def admin_upload_pdf(user_id, title, link):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    pdf_response = supabase.table('pdfs').insert({"user_id" : user_id, 'name' : title, 'link' : link}).execute()
    pdf_id = pdf_response.data[0]['pdf_id']
    return pdf_id


def admin_update_pdf_id(pdf_id, mathpix_id):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("UPDATING PDF ID", pdf_id, mathpix_id)
    data = supabase.table('pdfs').update({"mathpix_id": mathpix_id}).eq("pdf_id", pdf_id).execute()
    return data


def get_pdfs(supabase, user_id):
    pdf_response = supabase.table('pdfs').select("*").eq("user_id", user_id).execute()
    return pdf_response.data


def admin_upload_page(pdf_id, page_number, summary):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("summary:", summary, "page_number", page_number)
    page_response = supabase.table('pages').insert({"pdf_id" : pdf_id, 'page_number' : page_number, 'summary' : summary}).execute()
    page_id = page_response.data[0]['page_id']
    return page_id


def admin_upload_page_chunk(embedding, content, type, page_id):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("Uploading:", content)
    chunk_response = supabase.table('page_chunks').insert({"embedding" : embedding, "content" : content, "type" : type, 'page_id' : page_id}).execute()
    chunk_id = chunk_response.data[0]['chunk_id']
    print("Uploaded:", chunk_id)
    return chunk_id


def user_match_page_summaries(supabase, user_id, embedding):
    result = supabase.rpc('match_page_summaries', {'embedding': embedding, 'match_threshold': 0.75,
                          'match_count': 10, 'user_id': user_id}).execute()
    return result.data


def update_task_status(task_id, status):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    response = supabase.table("task_queue").update({"status": status}).eq("id", task_id).execute()
    return response.data

def get_chat_history(user_id):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    response = supabase.table('chat_history').select("history").order(column='created_at', desc=True).limit(1).eq('user_id', user_id).execute()
    return response.data

def set_chat_history_with_system(user_id, content):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    #response = supabase.table('chat_history').select("history").order(column='created_at', desc=False).limit(1).eq('user_id', user_id).execute()
    history = {'memory': [{
        "role": "system",
        "content": content,
    }]}
    print('adding history:', history)
    response = supabase.table("chat_history").insert({"user_id": user_id, "history": history}).execute()
    print(response.data)
    return response.data

def update_chat_history(user_id, role, new_message):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    old_history_results = supabase.table('chat_history').select("*").order(column='created_at', desc=True).limit(1).eq('user_id', user_id).execute()
    history = old_history_results.data[0]
    print(history)
    memory = history['history']["memory"]
    memory.append({'role':role,'content':new_message})
    history['history'] = {"memory": memory}
    response = supabase.table("chat_history").update({"history": {"memory": memory}}).eq("user_id", user_id).execute()
    return response.data[0]

def execute_tasks_in_queue(appcontext, request, index_fn):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("QUEUE: checking for in_progress tasks")
    response = supabase.table("task_queue").select("*").eq("status", "in_progress").execute()
    if response.data: return
    print("QUEUE: no in_progress tasks found, beginning index...")
    task = True
    while task:
        response = supabase.table("task_queue").select("*").eq("status", "pending").order(column='created_at', desc=False).limit(1).execute() # get oldest
        task = response.data[0] if response.data else None
        # Update the task status to "in_progress"
        if task:
            print('QUEUE: doing task:', task['task_name'])
            supabase.table("task_queue").update({"status": "in_progress"}).eq("id", task["id"]).execute()
            with appcontext: #app.app_context():
                thread = threading.Thread(target=index_fn, args=[
                    task["task_name"],
                    task["task_data"]["google_drive_share_link"],
                    task["user_id"],
                    get_profile_key(supabase, task["user_id"], 'pages_uploaded'),
                    get_profile_key(supabase, task["user_id"], 'max_pages'),
                    task["task_data"]["start_page"],
                    task["task_data"]["end_page"],
                    True,
                    True])
                thread.start()
                thread.join()
            # Delete the task after it's done
            print('QUEUE: deleting task:', task['task_name'])
            supabase.table("task_queue").delete().eq("id", task["id"]).execute()
        else:
            print('QUEUE: nothing left in queue')

def add_task_to_queue(user_id, task_name, task_data, auth):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    task = {
        "user_id": user_id,
        "task_name": task_name,
        "task_data": task_data,
        "status": "pending",
        "auth": auth
    }
    response = supabase.table("task_queue").insert(task).execute()
    return response.data

def get_payment_type(user_id):
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    payment_type = get_profile_key(supabase, user_id, "payment_type")
    return payment_type