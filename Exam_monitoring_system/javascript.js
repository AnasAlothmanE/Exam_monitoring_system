function changeTextWithText() {
    const username = localStorage.getItem('username');

    fetch('http://localhost:3000/api/text')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data.texts) && Array.isArray(data.questions)) {
                const container = document.createElement('div');
                container.className = 'grid-container'; // إضافة class للتنسيق بالـ grid

                data.questions.forEach((questionData, questionIndex) => {
                    let questionContainerDiv = document.createElement("div");
                    questionContainerDiv.className = "question-container"; // إعطاء الـ div Class لتسهيل تنسيقه لاحقاً

                    for (let i = 0; i < 4; i++) {
                        let spanElement = document.createElement("span");
                        questionContainerDiv.appendChild(spanElement);
                    }

                    let questionLabel = document.createElement("label");
                    questionLabel.className = "question";
                    questionLabel.innerText = `${questionData.text}`;

                    questionContainerDiv.appendChild(questionLabel);
                    questionContainerDiv.appendChild(document.createElement("br"));

                    let hasOptions = false;

                    for (let i = 0; i < 4; i++) {
                        let textIndex = questionIndex * 4 + i;

                        if (textIndex < data.texts.length) {
                            let text = data.texts[textIndex].text;

                            let optionLabel = document.createElement("label");
                            optionLabel.className = "option";

                            let radioInput = document.createElement("input");
                            radioInput.type = "radio";
                            radioInput.name = `question${questionIndex}`; // تعيين اسم مجموعة فريدة لكل مجموعة من عناصر الراديو
                            radioInput.value = text;

                            optionLabel.appendChild(radioInput);
                            optionLabel.appendChild(document.createTextNode(`${text || 'No text available'}`));

                            questionContainerDiv.appendChild(optionLabel);
                            questionContainerDiv.appendChild(document.createElement("br"));

                            hasOptions = true;
                        }
                    }

                    if (!hasOptions) {
                        let noOptionsMessage = document.createElement("p");
                        noOptionsMessage.className = "no-options-message";
                        noOptionsMessage.innerText = "No options available for this question.";
                        questionContainerDiv.appendChild(noOptionsMessage);
                    }

                    container.appendChild(questionContainerDiv);
                });

                document.body.appendChild(container);

                setTimeout(() => {
                    document.querySelectorAll('.question-container').forEach((element, index) => {
                        setTimeout(() => {
                            element.classList.add('visible');
                        }, index * 200); 
                    });
                }, 100); 
                
                fetch('http://localhost:3000/api/run-python-script', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to run Python script');
                    }
                })
                .catch(error => console.error('Error running Python script:', error));

                
                let saveButton = document.createElement("button");
                saveButton.id = "saveButton";
                saveButton.innerText = "حفظ الخيارات";

                
                for (let i = 0; i < 4; i++) {
                    let spanElement = document.createElement("span");
                    saveButton.appendChild(spanElement);
                }

                document.body.appendChild(saveButton);

                saveButton.addEventListener('click', saveSelections);

                document.querySelectorAll('.option input[type="radio"]').forEach(radioInput => {
                    radioInput.addEventListener('change', () => {
                        // إزالة الفئة selected من جميع العناصر داخل السؤال الحالي
                        let currentQuestionContainer = radioInput.closest('.question-container');
                        currentQuestionContainer.querySelectorAll('.option').forEach(option => {
                            option.classList.remove('selected');
                        });

                        radioInput.closest('.option').classList.add('selected');
                    });
                });
            } else {
                console.error('API data is not in the expected format.');
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}


function saveSelections() {
    let selections = [];
    let allAnswered = true; 

    document.querySelectorAll('.question-container').forEach((container) => {
        let questionLabel = container.querySelector('.question');
        let questionText = questionLabel.innerText;
        let selectedOptionText = '';

        container.querySelectorAll('input[type="radio"]').forEach((radioInput) => {
            if (radioInput.checked) {
                selectedOptionText = radioInput.nextSibling.textContent.trim();
            }
        });

        if (!selectedOptionText) {
            allAnswered = false;

            let noAnswerMessage = document.createElement("p");
            noAnswerMessage.className = "no-answer-message";
            noAnswerMessage.innerText = "يرجى اختيار إجابة لهذا السؤال.";
            container.insertBefore(noAnswerMessage, questionLabel); // إضافة الرسالة فوق السؤال
        } else {
            selections.push({
                question: questionText,
                selectedOptionText: selectedOptionText
            });
        }
    });

    if (allAnswered) {
        console.log('Selections:', selections); 

        const username = localStorage.getItem('username');

        fetch('http://localhost:3000/api/saveSelections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, selections })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(`تم حفظ الخيارات بنجاح! علامتك: ${result.score}%`);

                window.location.href = 'login.html';

                document.querySelectorAll('.question-container').forEach(container => {
                    container.querySelectorAll('input[type="radio"]').forEach(radioInput => {
                        radioInput.checked = false;
                    });

                    let noAnswerMessage = container.querySelector('.no-answer-message');
                    if (noAnswerMessage) {
                        noAnswerMessage.remove();
                    }
                });
            } else {
                alert('حدث خطأ أثناء حفظ الخيارات.');
            }
        })
        .catch(error => console.error('Error saving selections:', error));
    } else {
        alert('يرجى الإجابة على جميع الأسئلة قبل الحفظ.');
    }
}

window.onload = changeTextWithText;


