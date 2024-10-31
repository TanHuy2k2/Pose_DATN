from dotenv import load_dotenv
from qdrant_client import QdrantClient, models
from qdrant_client.models import VectorParams, Distance  # type: ignore
import os
import numpy as np
import cv2

load_dotenv("../backend/weights/.env")

qclient = QdrantClient(
    url=os.getenv("QDRANT_DB_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# recreate collection
collection_name = "face_db"
collection = qclient.recreate_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(
        size = 128,
        distance=Distance.COSINE
    )
)
# Verify
def verify(embedding, lower_threshold=0.3, upper_threshold=0.7, limit=1, count_id = 0):
    try:
        # Perform search
        result = qclient.search(
            collection_name=collection_name,
            query_vector=embedding,
            limit=limit,
            with_payload=True,
            with_vectors=True
        )[0].score
        if not result:
            print("No results found.")
            save_face_data(np.random.rand(128), count_id, {"type": "dummy"})
            return False
        if result < lower_threshold:
            print(f"Result is not human enough: {result}")
            return True
        return result > upper_threshold
    except Exception as e:
        print(f"An error occurred during the search: {e}")
        return False

def load_face_data(query_vector):
    search_result = qclient.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=1,
        with_payload=True,
        with_vectors=False
    )[0].payload
    if not search_result:
        return None
    else:
        name_label = search_result["name"]
        gender_label = search_result["gender"]
        age_label = search_result["age"]
        # height_label = search_result["height"]
        # weight_label = search_result["weight"]
        level_label = search_result["level"]
        bmi_label = search_result["bmi"]
        return name_label, gender_label, age_label, level_label, bmi_label
    
# Put to DB
def save_face_data(vector, payload):
    # Query for the vector with the highest ID (assuming IDs are integers)
    points = qclient.scroll(collection_name=collection_name, offset=None, limit=7, with_vectors=False)

    last_id = points[0][-1].id if points[0] else None
    print(f"The last ID is: {last_id}")

    if last_id == None:
        count_id = 1
    else:
        count_id = last_id + 1

    record = models.Record(
        id = count_id,
        payload=payload,
        vector=vector
    )
    qclient.upload_records(
        collection_name=collection_name,
        records=[record]
    )


    