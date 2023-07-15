import pickle
from supabase import create_client, Client

SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eXdjeXplYm1uaGJ4bHFrbWJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3OTE4MzQwOCwiZXhwIjoxOTk0NzU5NDA4fQ.jxv7TPzCbiN4ydlp5EPKttq3zOzzvy3SXIz_VvNGp_I"
SUPABASE_URL = "https://eyywcyzebmnhbxlqkmbj.supabase.co"
MAX_OPENAI_CALLS_PER_MIN = 1000

def load_embedding_index(embedding_index_file):
    with open(embedding_index_file, "rb") as file:
        embedding_index = pickle.load(file)
    return embedding_index

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Change this for you
dir = r'C:\Users\saile\Downloads\index (1)'

pd_index = load_embedding_index(dir)

# Get this from supabase dashboard
user_id = '3e5c01d3-a2d7-4aac-b5d3-1d9810dab42b'
# titles = pd_index['titles'].unique()
titles = ['Brunton et al, 2016', 'Schmidt & Fedderath, 2011', 'Schmidt et al, 2006']

for title in titles:
    # upload pdf to db
    pd_rows_of_title = pd_index.loc[pd_index['titles'] == title]
    # in actual code check if title exists
    pdf_response = supabase.table('pdfs').insert({"user_id" : user_id, 'name' : title, 'link' : pd_rows_of_title.iloc[0]["pdf_links"]}).execute()
    pdf_id = pdf_response.data[0]['pdf_id']
    for page_number in pd_rows_of_title['page_nums'].unique():
        # upload page to db
        pd_rows_of_page = pd_rows_of_title.loc[pd_index['page_nums'] == page_number]
        print(f"pdf_id: {pdf_id}, page number: {page_number}")
        page_response = supabase.table('pages').insert({"pdf_id" : pdf_id, 'page_number' : page_number}).execute()
        page_id = page_response.data[0]['page_id']
        for index, pd_chunk in pd_rows_of_page.iterrows():
            # upload page chunk
            chunk_response = supabase.table('page_chunks').insert({"embedding" : pd_chunk['embeddings'].tolist(), 'content' : pd_chunk['contents'], 'type' : pd_chunk['types'], 'page_id' : page_id}).execute()