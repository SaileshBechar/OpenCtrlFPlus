import requests
import re
from keys import google_drive_api_key

# https://drive.google.com/drive/folders/13j5WXS8UvNHCvo7W5yWlDa7KmpdhiO7G?usp=sharing
def get_pdf_files_from_google_drive_folder_share_link(folder_link):
    file_names = []
    file_links = []
    folder_id = folder_link.split("folders/")[1].split('?')[0]
    #folder_link = folder_link.split('?')[0]
    #folder_id = re.search(r"folders\/(.*)", folder_link).group(1)
    api_endpoint = f"https://www.googleapis.com/drive/v3/files?q=%27{folder_id}%27+in+parents&fields=files(name%2CwebContentLink)&key=YOUR_API_KEY"
    response = requests.get(api_endpoint.replace("YOUR_API_KEY", google_drive_api_key))
    if response.status_code == 200:
        json_response = response.json()
        for file in json_response["files"]:
            file_names.append(file["name"])
            file_links.append(file["webContentLink"])
    else:
        print("Failed to retrieve folder contents")
        exit()
    return file_links