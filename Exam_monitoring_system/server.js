const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { exec ,spawn} = require('child_process');
const { promisify } = require('util');




const execPromise = promisify(exec);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/text', async (req, res) => {
    try {
        const textsFilePath = path.join(__dirname, 'texts.json');
        const questionsFilePath = path.join(__dirname, 'questions.json');

        const [textsData, questionsData] = await Promise.all([
            fs.readFile(textsFilePath, 'utf8'),
            fs.readFile(questionsFilePath, 'utf8')
        ]);

        res.json({
            texts: JSON.parse(textsData),
            questions: JSON.parse(questionsData)
        });
    } catch (err) {
        console.error('Error reading files:', err);
        res.status(500).send('Error reading files');
    }
});

app.post('/api/saveSelections', async (req, res) => {
    const { username, selections } = req.body;

    if (!username || !Array.isArray(selections) || selections.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const selectionsFilePath = path.join(__dirname, 'selections.json');
    const trueFilePath = path.join(__dirname, 'true.json');
    const marksFilePath = path.join(__dirname, 'mark.json');
    const blockFilePath = path.join(__dirname, 'block.json');

    try {
        const [trueData, blockData, selectionsData] = await Promise.all([
            fs.readFile(trueFilePath, 'utf8'),
            fs.readFile(blockFilePath, 'utf8'),
            fs.readFile(selectionsFilePath, 'utf8')
        ]);

        const trueAnswers = JSON.parse(trueData);
        const blockedUsers = JSON.parse(blockData);
        const existingSelections = JSON.parse(selectionsData);

        let score = 0;

        if (blockedUsers.includes(username)) {
            score = 0;
        } else {
            selections.forEach(selection => {
                const correctAnswer = trueAnswers.find(q => q.question.trim() === selection.question.trim())?.correctAnswer;

                // استخدام trim() لإزالة المسافات الزائدة وتوحيد حالة الأحرف باستخدام toLowerCase()
                if (correctAnswer && selection.selectedOptionText.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
                    score += 1;
                }
            });

            score = (score / trueAnswers.length) * 100;
        }

        existingSelections[username] = selections;

        await fs.writeFile(selectionsFilePath, JSON.stringify(existingSelections, null, 2));
        
        const marks = JSON.parse(await fs.readFile(marksFilePath, 'utf8'));
        marks[username] = score;

        await fs.writeFile(marksFilePath, JSON.stringify(marks, null, 2));
        res.json({ success: true, score });

        await execPromise('taskkill /IM python.exe /F');
        console.log('Python process stopped');
    } catch (err) {
        console.error('Error processing selections:', err);
        res.status(500).json({ success: false, message: 'Error processing selections' });
    }
});


app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const accountsFilePath = path.join(__dirname, 'account.json');

    try {
        const data = await fs.readFile(accountsFilePath, 'utf8');
        const accounts = JSON.parse(data);
        const account = accounts.find(acc => acc.username === username && acc.password === password);

        if (account) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error('Error reading accounts file:', err);
        res.status(500).send('Error reading accounts file');
    }
});

app.get('/api/account_teacher', async (req, res) => {
    const filePath = path.join(__dirname, 'account_teacher.json');

    try {
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading account_teacher.json:', err);
        res.status(500).json({ error: 'Failed to read account_teacher.json' });
    }
});

app.post('/api/run-python-script', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).send('Username is required');
    }

    exec(`python main.py ${username}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return res.status(500).send('Error running Python script');
        }
        console.log(`Python script output: ${stdout}`);
        res.send('Python script ran successfully');
    });
});

app.post('/api/stopPython', async (req, res) => {
    try {
        await execPromise('taskkill /IM python.exe /F');
        console.log('Python process stopped');
        res.send('Python process stopped.');
    } catch (error) {
        console.error(`Error stopping Python process: ${error.message}`);
        res.status(500).send('Failed to stop Python process.');
    }
});

app.post('/api/saveQuestions', async (req, res) => {
    const { questions } = req.body;
    console.log(questions);

    if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const trueFilePath = path.join(__dirname, 'true.json');
    const questionsFilePath = path.join(__dirname, 'questions.json');
    const answersFilePath = path.join(__dirname, 'texts.json');

    try {
        const formattedData = questions.map(q => ({
            question: q.question,
            correctAnswer: q.correctAnswer,
        }));

        const allQuestions = questions.map(q => ({
            text: q.question,
        }));
        const formattedAnswers = [];
        questions.forEach(q => {
            q.answers.forEach(answer => {
                formattedAnswers.push({ text: answer });
            });
        });

        await fs.writeFile(trueFilePath, JSON.stringify(formattedData, null, 2));
        console.log('Questions and correct answers saved successfully in true.json');

        await fs.writeFile(questionsFilePath, JSON.stringify(allQuestions, null, 2));
        console.log('All questions saved successfully in questions.json');

        await fs.writeFile(answersFilePath, JSON.stringify(formattedAnswers, null, 2));
        console.log('All answers saved successfully in texts.json');

        res.json({ success: true });
    } catch (err) {
        console.error('Error saving files:', err);
        res.status(500).json({ success: false, message: 'Error saving files' });
    }
});

const studentsFilePath = path.join(__dirname, 'account.json');
const teachersFilePath = path.join(__dirname, 'account_teacher.json');

app.post('/api/addAccount', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: 'الرجاء ملء جميع الحقول' });
    }

    const account = { username, password };
    
    try {
        if (role === 'student') {
            const studentsData = JSON.parse(await fs.readFile(studentsFilePath, 'utf8'));
            studentsData.push(account);
            await fs.writeFile(studentsFilePath, JSON.stringify(studentsData, null, 2));
        } else if (role === 'teacher') {
            const teachersData = JSON.parse(await fs.readFile(teachersFilePath, 'utf8'));
            teachersData.push(account);
            await fs.writeFile(teachersFilePath, JSON.stringify(teachersData, null, 2));
        } else {
            return res.status(400).json({ success: false, message: 'نوع الحساب غير صالح' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error processing account:', err);
        res.status(500).json({ success: false, message: 'خطأ في معالجة الحساب' });
    }
});

app.get('/api/getMarks', async (req, res) => {
    const marksFilePath = path.join(__dirname, 'mark.json');

    try {
        const data = await fs.readFile(marksFilePath, 'utf8');
        const marks = JSON.parse(data);
        res.json(marks);
    } catch (err) {
        console.error('Error reading mark.json:', err);
        res.status(500).send('Error reading mark.json');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

    
});
