const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

mongoose.connect('mongodb+srv://ankitjha01aj:prBjZORZDw1N0FFP@jwala.duidkiz.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
// Define a mongoose schema for the student model
const studentSchema = new mongoose.Schema({
    name: String,
    age: String,
    gender: String,
    rollno: Number,
    marks: {
        physics: {
            type: [Number, Number],
            validate: {
                validator: function (value) {
                    // Ensure marks obtained is not greater than total marks
                    return value[0] >= 0 && value[0] <= value[1];
                },
                message: 'Invalid marks for physics. Marks obtained cannot be negative, and it should be less than or equal to total marks.'
            }
        },
        chemistry: {
            
            type: [Number, Number],
            required:false,
            validate: {
                validator: function (value) {
                    // Validate only if chemistry marks are provided
                    if (value && value.length === 2) {
                        return value[0] >= 0 && value[0] <= value[1];
                    }
                    return true; // Validation passes if chemistry marks are not provided
                },
                message: 'Invalid marks for chemistry. Marks obtained cannot be negative, and it should be less than or equal to total marks.'
            }
        },
        maths: {
            type: [Number, Number],
            validate: {
                validator: function (value) {
                    // Ensure marks obtained is not negative and less than or equal to total marks
                    return value[0] >= 0 && value[0] <= value[1];
                },
                message: 'Invalid marks for maths. Marks obtained cannot be negative, and it should be less than or equal to total marks.'
            }
        }
    }
});

// Create a mongoose model based on the schema
const Student = mongoose.model('Student', studentSchema);

// Endpoint to handle POST requests
app.post('/addStudent', async (req, res) => {
    try {
        const { name, age, gender, marks,rollno } = req.body;

        // Validate the required fields
        if (!name || !age || !gender || !marks || !rollno) {
            return res.status(400).json({ error: 'Incomplete data. Please provide all required fields.' });
        }

        // Create a new student instance
        const newStudent = new Student({
            name,
            rollno,
            age,
            gender,
            marks
        });

        // Save the student to the database
        await newStudent.save();

        res.status(201).json({ message: 'Student added successfully.' });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const studentSchema2 = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    rollno: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    years_old: {
        type: String,
        required: true
    },
    scores: {
        subjects: {
            type: [String],
            required: true,
           
        },
        marks_obtained: {
            type: [Number],
            required: true
        },
        total_marks: {
            type: [Number],
            required: true
        }
    }
});

// Create a mongoose model based on the schema
const Student2 = mongoose.model('Student2', studentSchema2);

// Endpoint to handle POST requests for student2 records
app.post('/addStudent2', async (req, res) => {
    try {
        const { first_name, rollno, last_name, years_old, scores } = req.body;

        // Validate the required fields
        if (!first_name || !rollno || !last_name || !years_old || !scores || !scores.subjects || !scores.marks_obtained || !scores.total_marks) {
            return res.status(400).json({ error: 'Incomplete data. Please provide all required fields.' });
        }

        // Create a new student instance
        const newStudent2 = new Student2({
            first_name,
            rollno,
            last_name,
            years_old,
            scores
        });

        // Save the new student to the database
        await newStudent2.save();

        res.status(201).json({ message: 'Student added successfully.' });
    } catch (error) {
        console.error('Error processing request:', error);
        if (error.name === 'ValidationError') {
            // Custom validation error message
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to handle GET requests for all student records with percentages
app.get('/getAllStudents', async (req, res) => {
    try {
        // Retrieve all student records from the database
        const students = await Student.find();
        const students2=await Student2.find();

        // Calculate percentages and format the response
        const formattedStudents = students.map(student => ({
            name: student.name,
            age: student.age,
            gender: student.gender,
            physics_percentage: calculatePercentage(student.marks.physics),
            chemistry_percentage: calculatePercentage(student.marks.chemistry),
            maths_percentage: calculatePercentage(student.marks.maths),
            overall_percentage: calculateOverallPercentage(student.marks)
        }));
        const formattedStudents2 = students2.map(student2 => {
            const physicsPercentage = (student2.scores.marks_obtained[student2.scores.subjects.indexOf('physics')] / student2.scores.total_marks[student2.scores.subjects.indexOf('physics')]) * 100;
            const chemistryPercentage = (student2.scores.marks_obtained[student2.scores.subjects.indexOf('chemistry')] / student2.scores.total_marks[student2.scores.subjects.indexOf('chemistry')]) * 100;
            const mathsPercentage = (student2.scores.marks_obtained[student2.scores.subjects.indexOf('maths')] / student2.scores.total_marks[student2.scores.subjects.indexOf('maths')]) * 100;
            const overallPercentage = ((physicsPercentage + chemistryPercentage + mathsPercentage) / 3).toFixed(2);

            return {
                name: `${student2.first_name} ${student2.last_name}`,
                age: student2.years_old,
                gender: '', // Gender information not provided in the given data
                physics_percentage: physicsPercentage.toFixed(2),
                chemistry_percentage: chemistryPercentage.toFixed(2),
                maths_percentage: mathsPercentage.toFixed(2),
                overall_percentage: overallPercentage
            };
        });


        res.status(200).json(formattedStudents.concat(formattedStudents2));
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to calculate percentage
const calculatePercentage = (marks) => {
    if (!marks || marks.length !== 2 || marks[1] === 0) {
        return null; // Handle invalid marks format or total_marks being zero
    }
    return (marks[0] / marks[1]) * 100;
};

// Function to calculate overall percentage
const calculateOverallPercentage = (marks) => {
    const percentages = Object.values(marks).map(calculatePercentage).filter(percent => percent !== null);
    if (percentages.length === 0) {
        return null; // Handle no valid percentages
    }
    return percentages.reduce((sum, percentage) => sum + percentage, 0) / percentages.length;
};




// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});