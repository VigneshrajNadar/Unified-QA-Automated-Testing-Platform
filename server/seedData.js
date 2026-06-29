const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const TestCase = require('./models/TestCase');
const Defect = require('./models/Defect');
const { connectDB } = require('./database');
const bcrypt = require('bcrypt');

const seedData = async () => {
    try {
        await connectDB();
        
        // 1. Ensure Demo Users Exist
        const adminPw = await bcrypt.hash('admin123', 10);
        const devPw = await bcrypt.hash('dev123', 10);
        const testerPw = await bcrypt.hash('tester123', 10);

        let admin = await User.findOne({ email: 'admin@meghana.com' });
        if (!admin) admin = await User.create({ name: 'Admin User', email: 'admin@meghana.com', password: adminPw, role: 'Admin' });

        let dev = await User.findOne({ email: 'dev@meghana.com' });
        if (!dev) dev = await User.create({ name: 'Developer User', email: 'dev@meghana.com', password: devPw, role: 'Developer' });

        let tester = await User.findOne({ email: 'tester@meghana.com' });
        if (!tester) tester = await User.create({ name: 'Tester User', email: 'tester@meghana.com', password: testerPw, role: 'Tester' });

        console.log('✅ Demo Users verified');

        // 2. Ensure a Project exists
        let project = await Project.findOne({ name: 'E-Commerce Website Revamp' });
        if (!project) {
            project = await Project.create({
                name: 'E-Commerce Website Revamp',
                description: 'Complete overhaul of the main checkout flow and shopping cart.',
                status: 'Active',
                created_by: admin._id
            });
        }
        console.log('✅ Project verified');

        // 3. Seed Test Cases
        let testCase = await TestCase.findOne({ title: 'Verify Guest Checkout Flow' });
        if (!testCase) {
            testCase = await TestCase.create({
                project_id: project._id,
                title: 'Verify Guest Checkout Flow',
                description: 'Ensure a non-logged in user can add an item to the cart and complete checkout.',
                type: 'Functional',
                priority: 'High',
                status: 'Active',
                created_by: tester._id,
                steps: [
                    { step_number: 1, action: 'Open homepage', expected_result: 'Homepage loads' },
                    { step_number: 2, action: 'Click Add to Cart on first item', expected_result: 'Item added to cart' },
                    { step_number: 3, action: 'Click Checkout', expected_result: 'Redirected to Guest Checkout page' },
                    { step_number: 4, action: 'Enter shipping and payment details', expected_result: 'Order placed successfully' }
                ]
            });
        }
        console.log('✅ Test Cases verified');

        // 4. Seed Defects
        let defect = await Defect.findOne({ title: 'Checkout crashes when using AMEX card' });
        if (!defect) {
            defect = await Defect.create({
                project_id: project._id,
                test_case_id: testCase._id,
                title: 'Checkout crashes when using AMEX card',
                description: 'When the user inputs an AMEX card in the guest checkout flow, the server throws a 500 error.',
                severity: 'Critical',
                priority: 'High',
                status: 'Open',
                reported_by: tester._id,
                assignee_id: dev._id,
                branch_name: 'fix/amex-checkout-crash',
                pr_link: 'https://github.com/company/repo/pull/1234',
                ci_status: 'Fail'
            });
        }
        console.log('✅ Defects verified');

        console.log('🎉 Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
