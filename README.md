# AWS Cloud Practitioner Exam Prep

An interactive web application to help users prepare for the AWS Certified Cloud Practitioner (CLF-C02) exam.

## Features

- 23 practice exam dumps
- Timed exams (90 minutes)
- Immediate feedback on answers
- Detailed results review
- Dark/Light theme toggle
- Responsive design for various devices
- Interactive background animation

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Django (Python)
- RESTful API for exam data
- GSAP for animations
- Responsive Canvas background

## Setup and Installation

1. Clone the repository:

```
git clone https://github.com/your-username/aws-cloud-practitioner-prep.git
```

2. Navigate to the project directory:

```
cd aws-cloud-practitioner-prep
```

3. Create a virtual environment and activate it:

```
python -m venv venv
source venv/bin/activate  # On Windows use venv\Scripts\activate
```

4. Install the required dependencies:

```
pip install -r requirements.txt
```

5. Set up the Django secret key:

```
- Edit the following line: `DJANGO_SECRET_KEY=your_secret_key_here`
```

6. Run migrations:

```
- python manage.py migrate
```

7. Start the development server:

```
python manage.py runserver
```

8. Open your browser and navigate to `http://localhost:8000`

## Usage

1. Select an exam from the dropdown menu on the landing page
2. Click "Start" to begin the exam
3. Answer questions and use the navigation buttons to move between questions
4. Submit the exam when finished or when time runs out
5. Review your results, including correct and incorrect answers with explanations

## Project Structure
aws-cloud-practitioner-prep/
├── test_prep/
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── js/
│   │   │   └── script.js
│   │   └── images/
│   ├── templates/
│   │   └── index.html
│   ├── views.py
│   ├── urls.py
│   └── models.py
├── manage.py
└── requirements.txt

## Key Components

- `views.py`: Contains the main logic for serving the application
- `urls.py`: Defines the URL patterns for the application
- `index.html`: The main template for the single-page application
- `styles.css`: Contains all the styling for the application
- `script.js`: Contains the JavaScript for handling exam logic and UI interactions

## API Endpoints

- `/api/exams/`: Returns a list of available exams
- `/api/exams/<exam_name>/`: Returns the questions for a specific exam

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- AWS for providing the Cloud Practitioner certification
- Font Awesome for icons
- Google Fonts for the Inter font family

## Contact

For any queries or suggestions, please open an issue on this repository or contact the maintainer directly.

---

Made with ☕ by [ancient-cthulhu](https://github.com/ancient-cthulhu)

LinkedIn: [Daniel Marquez](https://www.linkedin.com/in/dgmarquez/)
