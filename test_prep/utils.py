import boto3
import json
from django.conf import settings

s3 = boto3.client('s3')

def get_questions_from_s3(s3_key):
    response = s3.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=s3_key)
    content = response['Body'].read().decode('utf-8')
    return json.loads(content)