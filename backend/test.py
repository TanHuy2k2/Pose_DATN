import cv2
from ultralytics import YOLO
import numpy as np

# Load the pre-trained YOLOv8-pose model
model = YOLO("yolo11n-pose_openvino_model")  # 'n' stands for nano, you can also use 's', 'm', 'l' based on your requirements

# Open a video stream (webcam or video file)
cap = cv2.VideoCapture(0)  # 0 for webcam, or provide a video file path

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Perform pose estimation
    results = model(frame, imgsz = 320)

    # Draw the pose annotations on the frame
    annotated_frame = results[0].plot()

    # Display the frame with pose annotations
    cv2.imshow('YOLOv8 Pose Estimation', annotated_frame)

    # Press 'q' to exit the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
