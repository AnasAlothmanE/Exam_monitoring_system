import cv2
import mediapipe as mp
import numpy as np
import json
import sys


mp_face_mesh = mp.solutions.face_mesh

def is_looking_at_camera(image):
    with mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5) as face_mesh:

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(image_rgb)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                left_eye = np.array([face_landmarks.landmark[33].x, face_landmarks.landmark[33].y])
                right_eye = np.array([face_landmarks.landmark[263].x, face_landmarks.landmark[263].y])
                nose_tip = np.array([face_landmarks.landmark[1].x, face_landmarks.landmark[1].y])
                chin = np.array([face_landmarks.landmark[152].x, face_landmarks.landmark[152].y])

                eye_slope = (right_eye[1] - left_eye[1]) / (right_eye[0] - left_eye[0] + 1e-6)

                if abs(eye_slope) < 0.1 and abs(nose_tip[0] - chin[0]) < 0.02:
                    return True
                else:
                    return False
        else:
            return False

def log_username(username):
    block_file_path = 'block.json'
    try:
        with open(block_file_path, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        data = []

    if username not in data:
        data.append(username)

    with open(block_file_path, 'w') as file:
        json.dump(data, file, indent=4)

def start_monitoring(username):
    cap = cv2.VideoCapture(0)

    while cap.isOpened():
        success, image = cap.read()
        if not success:
            break

        is_looking = is_looking_at_camera(image)
        #cv2.imshow("Camera Feed", image)
        
        if not is_looking:
            log_username(username)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()



if len(sys.argv) != 2:
    print("Usage: python main.py <username>")
    sys.exit(1)

username = sys.argv[1]

start_monitoring(username)