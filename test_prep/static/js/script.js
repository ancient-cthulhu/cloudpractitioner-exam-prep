let currentExam = null;
let timer = null;
let userAnswers = {};  
let currentQuestionIndex = 0;
let selectedExam = null;
let examMode = 'real'; 
let currentQuestionConfirmed = false;
let examStartTime = null;

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}


function fetchExams() {
    console.log('Fetching exams...');
    fetch('/api/exams/')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {

        populateExamSelector(data);
    })
    .catch(error => {
        console.error('Error fetching exam list:', error);
        showPopup('Failed to load exams. Please check if exam files exist and refresh the page.');
    });
}

function startExam(mode) {
    const examSelector = document.getElementById('examSelector');
    if (examSelector) {
        selectedExam = examSelector.value;
    }
    
    if (!selectedExam) {
        showPopup('Please select an exam first.');
        return;
    }
    
    examMode = mode; // Store the exam mode
    
    const examUrl = `/api/exams/${encodeURIComponent(selectedExam)}`;
    
    fetch(examUrl)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Exam file not found');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.questions || data.questions.length === 0) {
                throw new Error('Invalid exam data structure');
            }
            currentExam = data;
            console.log("Loaded questions:", currentExam.questions.length);
            currentQuestionIndex = 0;
            userAnswers = {};  // Clear existing answers
            if (currentExam.questions.length !== 50) {
                console.warn(`Expected 50 questions, but loaded ${currentExam.questions.length}`);
            }
            examStartTime = Date.now();
            startTimer();
            showExamScreen();
        })
        .catch(error => {
            console.error('Error:', error);
            showPopup(`Failed to load exam: ${error.message}. Please try again.`);
        });
}

function populateExamSelector(exams) {

    const examSelector = document.getElementById('examSelector');
    if (!examSelector) {

        return;
    }
    examSelector.innerHTML = '';
    
    // Sort exams based on their numeric part
    exams.sort((a, b) => {
        const aNum = parseInt(a.match(/\d+/)[0]);
        const bNum = parseInt(b.match(/\d+/)[0]);
        return aNum - bNum;
    });
    
    exams.forEach((exam) => {
        const option = document.createElement('option');
        option.value = exam;
        const examNumber = exam.match(/\d+/)[0];
        option.textContent = `Exam ${examNumber}`;
        examSelector.appendChild(option);
    });
    
    selectedExam = exams[0];


    examSelector.addEventListener('change', function() {
        selectedExam = this.value;

    });

    // Set the initial value
    examSelector.value = selectedExam;
}

function updateSelectedExam() {
    const examSelector = document.getElementById('examSelector');
    if (examSelector) {
        selectedExam = examSelector.value;
        console.log('Manually updated selectedExam:', selectedExam);
    } else {
        console.error('Exam selector not found when trying to update selectedExam');
    }
}

function showExamScreen() {
    if (!isMobile()) {
        document.getElementById('blur-overlay').style.display = 'block';
    }
    document.getElementById('landing').style.display = 'none';
    document.getElementById('exam').style.display = 'flex';
    document.getElementById('results').style.display = 'none';
    document.getElementById('blur-overlay').style.display = 'block';

    renderCurrentQuestion();
    updateNavigationButtons(); 
    startTimer();
}

function returnToMenu() {
    document.getElementById('landing').style.display = 'flex';
    document.getElementById('exam').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('blur-overlay').style.display = 'none';

    resetExam();
}

function renderCurrentQuestion() {
    if (!currentExam || !currentExam.questions || currentExam.questions.length === 0) {
        console.error('No exam or questions available');
        return;
    }

    if (currentQuestionIndex >= currentExam.questions.length) {
        console.error('Invalid question index');
        return;
    }

    const q = currentExam.questions[currentQuestionIndex];
    const questionContainer = document.getElementById('currentQuestion');

    if (!questionContainer) {
        console.error('Question container not found');
        return;
    }

    const isChooseTwo = q.question.includes("(Choose TWO)");
    const isMultipleAnswer = isChooseTwo || q.correct_answer.length > 1;

    const confirmButtonHtml = examMode === 'instant' 
        ? `<button onclick="confirmAnswer(${q.id})">Confirm Answer</button>`
        : `<div class="confirm-button-container">
               <button onclick="confirmAnswer(${q.id})">Confirm Answer</button>
               <span class="confirmation-text" id="confirmationText${q.id}">Answer Confirmed</span>
           </div>`;

    questionContainer.innerHTML = `
    <div class="question" id="question${q.id}">
        <h3>Question ${currentQuestionIndex + 1} of ${currentExam.questions.length}</h3>
        <p style="overflow-wrap: break-word;">${q.question || 'Question text not available'}</p>
        <div class="options">
            ${q.options ? q.options.map((option, i) => `
                <button class="option-button ${userAnswers[q.id]?.includes(i) ? 'selected' : ''}" 
                        onclick="selectAnswer(${q.id}, ${i}, ${isMultipleAnswer}, ${isChooseTwo})">${option.replace(/^- /, '')}</button>
            `).join('') : 'No options available'}
        </div>
        <div id="feedback${q.id}" class="feedback"></div>
        <div class="navigation-buttons" style="justify-content: space-between; align-items: center;">
            <button onclick="navigateQuestion(-1)">Previous</button>
            ${confirmButtonHtml}
            <button onclick="navigateQuestion(1)">Next</button>
        </div>
    </div>
    `;

    updateNavigationButtons();
}

function confirmAnswer(questionId) {
    const selectedAnswers = userAnswers[questionId] || [];
    
    if (selectedAnswers.length === 0) {
        showPopup('Please select an answer before confirming.');
        return;
    }
    
    const feedbackElement = document.getElementById(`feedback${questionId}`);
    const confirmationText = document.getElementById(`confirmationText${questionId}`);
    
    if (examMode === 'instant') {
        const isCorrect = checkAnswer(questionId, selectedAnswers);
        if (isCorrect) {
            feedbackElement.textContent = 'Correct!';
            feedbackElement.className = 'feedback correct';
        } else {
            feedbackElement.textContent = 'Incorrect';
            feedbackElement.className = 'feedback incorrect';
        }
    } else {
        // For real exam mode
        feedbackElement.textContent = '';
        feedbackElement.className = 'feedback';
        
        // Show the confirmation text only in real exam mode
        confirmationText.classList.add('show');
        setTimeout(() => {
            confirmationText.classList.remove('show');
        }, 2000); // Hide after 2 seconds
    }

    currentQuestionConfirmed = true;
    updateNavigationButtons();
}

function checkAnswer(questionId, selectedAnswerIndices) {
    const question = currentExam.questions.find(q => q.id === questionId);
    if (!question) {
        console.error('Question not found');
        return false;
    }

    const correctAnswerIndices = question.correct_answer.split('').map(letter => 
        'ABCDE'.indexOf(letter)
    );

    const isCorrect = selectedAnswerIndices.length === correctAnswerIndices.length &&
        selectedAnswerIndices.every(index => correctAnswerIndices.includes(index)) &&
        correctAnswerIndices.every(index => selectedAnswerIndices.includes(index));

    return isCorrect;
}

function showResults() {
    document.getElementById('exam').style.display = 'none';
    document.getElementById('results').style.display = 'flex';
    document.getElementById('blur-overlay').style.display = 'block';

    let correctAnswers = 0;
    const reviewContainer = document.getElementById('reviewQuestions');
    reviewContainer.innerHTML = '';

    currentExam.questions.forEach((q, index) => {
        if (!q.options || !Array.isArray(q.options)) {
            console.error(`Question ${index + 1} has invalid options:`, q);
            return; 
        }

        const correctAnswerIndices = q.correct_answer.split('').map(letter => 
            'ABCDE'.indexOf(letter)
        );
        const userAnswerIndices = userAnswers[q.id] || [];  
        const isCorrect = checkAnswer(q.id, userAnswerIndices, false);  // Don't provide feedback here
        if (isCorrect) correctAnswers++;

        const userAnswersText = userAnswerIndices.map(index => 
            q.options[index] ? q.options[index].replace(/^- /, '') : 'Invalid answer'
        ).join(', ');
        const correctAnswersText = correctAnswerIndices.map(index => 
            q.options[index] ? q.options[index].replace(/^- /, '') : 'Unknown'
        ).join(', ');

        reviewContainer.innerHTML += `
        <div class="question ${isCorrect ? 'correct' : 'incorrect'}" data-question-type="${isCorrect ? 'correct' : 'incorrect'}">
            <h3>Question ${index + 1}</h3>
            <p class="answer-status">${isCorrect ? '✅ Correct' : '❌ Incorrect'}</p>
            <p>${q.question || 'No question text'}</p>
            <p><strong>Your answer${userAnswerIndices.length > 1 ? 's' : ''}:</strong> ${userAnswersText || 'Not answered'}</p>
            <p><strong>Correct answer${correctAnswerIndices.length > 1 ? 's' : ''}:</strong> ${correctAnswersText}</p>
            ${q.explanation ? `
                <div class="explanation">
                    <h4>Explanation:</h4>
                    ${formatExplanation(q.explanation)}
                </div>
            ` : ''}
        </div>
        `;
    });

    const totalQuestions = currentExam.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;
    document.getElementById('score').innerHTML = `
        <span style="font-size: 2rem;">Your Score: ${score.toFixed(2)}%</span><br>
        <span style="font-size: 1.5rem;">${correctAnswers} / ${totalQuestions} correct</span>
    `;

    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-buttons button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}


function formatExplanation(explanation) {
    const lines = explanation.split('\n');
    let formattedExplanation = '<ul>';
    let reference = '';

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('-')) {
            formattedExplanation += `<li>${line.substring(1).trim()}</li>`;
        } else if (line.startsWith('Reference:')) {
            reference = line;
        } else if (line !== '') {
            formattedExplanation += `<p>${line}</p>`;
        }
    });

    formattedExplanation += '</ul>';

    if (reference) {
        // Extract the URL from the reference line
        const urlMatch = reference.match(/<(https?:\/\/[^>]+)>/);
        if (urlMatch) {
            const url = urlMatch[1];
            formattedExplanation += `<p><strong>Reference: <a href="${url}" target="_blank">${url}</a></strong></p>`;
        } else {
            formattedExplanation += `<p><strong>${reference}</strong></p>`;
        }
    }

    return formattedExplanation;
}

function navigateQuestion(direction) {
    if (!currentQuestionConfirmed) {
        showPopup('Please confirm your answer before moving to another question.');
        return;
    }

    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < currentExam.questions.length) {
        currentQuestionIndex = newIndex;
        currentQuestionConfirmed = false;  
        renderCurrentQuestion();
        updateNavigationButtons(); 
    }
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const confirmButton = document.querySelector('.confirm-button-container button') || document.querySelector('.navigation-buttons button:nth-child(2)');
    
    if (prevButton) prevButton.disabled = (currentQuestionIndex === 0) || !currentQuestionConfirmed;
    if (nextButton) nextButton.disabled = (currentQuestionIndex === currentExam.questions.length - 1) || !currentQuestionConfirmed;
    if (confirmButton) confirmButton.disabled = currentQuestionConfirmed;
}

function startTimer() {
    clearInterval(timer);
    const examDuration = 70 * 60; // 90 minutes in seconds
    const endTime = examStartTime + (examDuration * 1000);
    
    const timerDisplay = document.getElementById('timer');
    timer = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Time left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            submitExam();
        }
    }, 1000);
}


function selectAnswer(questionId, answerIndex, isMultipleAnswer, isChooseTwo) {
    const buttons = document.querySelectorAll(`#question${questionId} .option-button`);
    
    if (!userAnswers[questionId]) {
        userAnswers[questionId] = [];
    }

    if (isMultipleAnswer) {
        if (isChooseTwo && userAnswers[questionId].length >= 2 && !userAnswers[questionId].includes(answerIndex)) {
            showPopup('You can only Choose TWO answers for this question.');
            return;
        }

        const index = userAnswers[questionId].indexOf(answerIndex);
        if (index > -1) {
            userAnswers[questionId].splice(index, 1);
            buttons[answerIndex].classList.remove('selected');
        } else {
            userAnswers[questionId].push(answerIndex);
            buttons[answerIndex].classList.add('selected');
        }
    } else {
        buttons.forEach((button, index) => {
            if (index === answerIndex) {
                button.classList.add('selected');
                userAnswers[questionId] = [answerIndex];
            } else {
                button.classList.remove('selected');
            }
        });
    }
    currentQuestionConfirmed = false;
    updateNavigationButtons();
    
    // Remove any existing feedback
    const feedbackElement = document.getElementById(`feedback${questionId}`);
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
}

function submitExam() {
    clearInterval(timer);
    const examEndTime = Date.now();
    const examDuration = (examEndTime - examStartTime) / 1000; // in seconds
    const averageTimePerQuestion = examDuration / currentExam.questions.length;
    
    showResults();
    
    // Add average time per question to the results display
    const scoreElement = document.getElementById('score');
    scoreElement.innerHTML += `<br><span style="font-size: 1.2rem;">Average time per question: ${averageTimePerQuestion.toFixed(2)} seconds</span>`;
}



function filterQuestions(filter) {
    const questions = document.querySelectorAll('#reviewQuestions .question');
    questions.forEach(question => {
        if (filter === 'all' || question.dataset.questionType === filter) {
            question.style.display = 'block';
        } else {
            question.style.display = 'none';
        }
    });
}

function returnToMenu() {
    const landingElement = document.getElementById('landing');
    const examElement = document.getElementById('exam');
    const resultsElement = document.getElementById('results');
    const blurOverlay = document.getElementById('blur-overlay');

    if (landingElement) landingElement.style.display = 'flex';
    if (examElement) examElement.style.display = 'none';
    if (resultsElement) resultsElement.style.display = 'none';
    if (blurOverlay) blurOverlay.style.display = 'none';

    resetExam();
}

function resetExam() {
    clearInterval(timer);
    currentExam = null;
    userAnswers = {};
    currentQuestionIndex = 0;
    examStartTime = null;
    document.getElementById('currentQuestion').innerHTML = '';
    document.getElementById('timer').textContent = 'Time left: 90:00';
    document.getElementById('examSelector').selectedIndex = 0;
    feedbackSetting = 'immediate';
    document.querySelectorAll('.settings-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.value === 'immediate');
    });
}

function showPopup(message) {
    const popup = document.getElementById('customPopup');
    const popupMessage = document.getElementById('popupMessage');
    
    popupMessage.textContent = message;
    popup.style.display = 'flex';

    // Automatically close the popup after 3 seconds
    setTimeout(() => {
        closePopup();
    }, 3000);
}

function closePopup() {
    const popup = document.getElementById('customPopup');
    popup.style.display = 'none';
}

function closePopup() {
    document.getElementById('customPopup').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', fetchExams);




(function() {
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 100;
    const connectionDistance = 150;
    let mouse = { x: null, y: null, radius: 150 };

    function isMobile() {
        return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function getParticleColor() {
        return document.documentElement.classList.contains('dark') 
            ? 'rgba(173, 216, 230, 0.2)' 
            : 'rgba(139, 169, 179, 0.2)'; 
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.3; 
            this.speedY = (Math.random() - 0.5) * 0.3; 
            this.color = getParticleColor();
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    this.x -= Math.cos(angle) * 0.5;
                    this.y -= Math.sin(angle) * 0.5;
                }
            }

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isMobile()) {
            canvas.classList.add('mobile-blur');
        } else {
            canvas.classList.remove('mobile-blur');
        }

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.strokeStyle = particles[i].color;
                    ctx.lineWidth = 1 - (distance / connectionDistance);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('mousemove', function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseout', function() {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('resize', function() {
        resizeCanvas();
        createParticles();
        if (isMobile()) {
            canvas.classList.add('mobile-blur');
        } else {
            canvas.classList.remove('mobile-blur');
        }
    });

    document.querySelector('.theme-toggle').addEventListener('click', function() {
        particles.forEach(p => p.color = getParticleColor());
    });

    // Initialize
    resizeCanvas();
    createParticles();
    animateParticles();

    // Expose isMobile to global scope
    window.isMobile = isMobile;
})();



// Expose necessary functions to global scope
window.startExam = startExam;
window.navigateQuestion = navigateQuestion;
window.submitExam = submitExam;
window.returnToMenu = returnToMenu;
window.toggleTheme = toggleTheme;
window.closePopup = closePopup;
window.confirmAnswer = confirmAnswer;
