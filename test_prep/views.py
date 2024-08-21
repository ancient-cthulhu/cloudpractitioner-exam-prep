import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json
import logging

logger = logging.getLogger(__name__)

class ExamListView(APIView):
    def get(self, request):
        try:
            exams_dir = os.path.join(settings.STATICFILES_DIRS[0], 'exams')
            exam_files = [f for f in os.listdir(exams_dir) if f.endswith('.json')]
            return Response(exam_files)
        except Exception as e:
            logger.error(f"Error fetching exam list: {str(e)}")
            return Response({"error": f"Failed to fetch exam list: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import codecs

class ExamDetailView(APIView):
    def get(self, request, exam_key):
        try:
            exam_path = os.path.join(settings.STATICFILES_DIRS[0], 'exams', exam_key)
            with codecs.open(exam_path, 'r', 'utf-8') as exam_file:
                exam_data = json.load(exam_file)
            return Response(exam_data)
        except Exception as e:
            logger.error(f"Error fetching exam data for {exam_key}: {str(e)}")
            return Response({"error": f"Failed to fetch exam data for {exam_key}: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)