const Submission = require("../models/submission");

module.exports = function(router){

    // Get all posts
    router.get("/submissions", async (req, res) => {
        const submissions = await Submission.find();
        res.send(submissions);
    });

    // create new submission
    router.post("/submissions", async (req, res) => {
        const submission = new Submission({
            email: req.body.email,
            collected: false
        });
        try {
            await submission.save();
            res.status(200).send(submission);
        } catch (e) {
            console.log(e);

            if (e.code === 11000) { // if it's just a duplicate email, let it respond successfully
                res.status(200).send();
            } else {
                res.status(400).send(`Error adding submission: ${e}`);
            }
        }
    });
};
