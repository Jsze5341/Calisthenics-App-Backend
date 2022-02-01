const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();
const jsonParser = bodyParser.json();
const db = require('./Database.js');

/*******************************************
 * INITIALIZE
 * ****************************************/

app.listen(3001, () => {
    //console.log("port 3001");
})

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


//Initial data get
app.get('/', (req, res, next) => {
    db.query("SELECT * FROM calisthenics;", (err, results, fields) => {
        if (err) {
            throw err;
        }
        res.send(results);
    });
});

/*******************************************
 * QUERIES
 * ****************************************/

//To be used when sorting main table when there are search filters
//Gets set in search query to be used in sort query

//THESE GLOBALS ARE POSSIBLY WRONG
let searchFlag;
let muscleFlag;
let diffFlag;

app.post('/search', jsonParser, (req, res, next) => {
    const objMuscles = {
        bicep: "bicep",
        tricep: "tricep",
        shoulders: "shoulders",
        back: "back",
        legs: "legs",
        core: "core"
    };

    const objDiff = {
        easy: "easy",
        medium: "medium",
        hard: "hard",
        elite: "elite"
    };

    var exer_name = "\"%" + String(req.body.exer_search) + "%\"";
    var muscle;
    var diff;

    console.log("-------------------");
    console.log("Search Input: ", exer_name);

    //If input is a muscle, saves muscle to be queried
    Object.values(objMuscles).find((obj) => {
        if (obj == String(req.body.exer_search).toLowerCase()) {
            muscle = obj;
            muscle = "\"" + muscle.charAt(0).toUpperCase() + muscle.slice(1) + "\""; //Capitalize first letter
            muscleFlag = muscle;
        }
    });

    //If input is a difficulty, saves difficulty to be queried
    Object.values(objDiff).find((obj) => {
        if (obj == String(req.body.exer_search).toLowerCase()) {
            diff = obj;
            diff = "\"" + diff.charAt(0).toUpperCase() + diff.slice(1) + "\""; //Capitalize first letter
            diffFlag = diff;
        }
    });
    console.log("before search", searchFlag);
    console.log("muscle type", muscleFlag);
    console.log("muscle", muscle);

    //If the search input is a muscle, gets all exercises with that muscle as well as exercises containing input
    if (typeof (muscle) != 'undefined') {
        console.log("Muscle search");
        db.query("SELECT * FROM calisthenics WHERE exer_name LIKE " + exer_name + " UNION SELECT * FROM calisthenics WHERE muscle = " + muscle, [exer_name, muscle], (err, results, fields) => {
            if (err) {
                throw err;
            }
            else {
                console.log("Search Result: ", results[0]);
                searchFlag = exer_name;
                console.log("searched", searchFlag);
                res.send(results);
            }
        });
    }

    //If the search input is a difficulty, gets all exercises with that difficulty as well as exercises containing input
    else if (typeof (diff) != 'undefined') {
        console.log("Diff search");
        var diff = "\"" + String(req.body.exer_search) + "\"";
        db.query("SELECT * FROM calisthenics WHERE exer_name LIKE " + exer_name + " UNION SELECT * FROM calisthenics WHERE difficulty = " + diff, [exer_name, diff], (err, results, fields) => {
            if (err) {
                throw err;
            }
            else {
                console.log("Search Result: ", results[0]);
                searchFlag = exer_name;
                console.log("searched", searchFlag);
                res.send(results);
            }
        });
    }

    else {
        db.query("SELECT * FROM calisthenics WHERE exer_name LIKE " + exer_name, [exer_name], (err, results, fields) => {
            if (err) {
                throw err;
            }
            else {
                console.log("Search Result: ", results[0]);
                searchFlag = exer_name;
                console.log("searched", searchFlag);
                res.send(results);
            }
        });
    }


});

//NEEDS FIXING
app.post('/sortsearch', jsonParser, (req, res, next) => {
    const exer_sort = String(req.body.exer_sort);

    console.log("searchFlag: ", searchFlag, "muscleFlag: ", muscleFlag, "diffFlag: ", diffFlag);

    function isValid() {
        return (typeof (req.body.exer_sort) != 'undefined' && req.body.exer_sort.length != 0);
    }

    if (typeof (diffFlag) != 'undefined' && diffFlag.length > 0) {
        muscleFlag = "";
    }

    else if (typeof (muscleFlag) != 'undefined' && muscleFlag.length > 0) {
        diffFlag = "";
    }


    //Orders data by inputted sort option when a search filter is a muscle
    if (isValid() && typeof (muscleFlag) != 'undefined' && muscleFlag.length > 0) {
        db.query("SELECT * FROM calisthenics WHERE exer_name LIKE " + muscleFlag + " UNION SELECT * FROM calisthenics WHERE muscle = " + muscleFlag + " ORDER BY " + exer_sort, [muscleFlag, exer_sort],
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("muscle search order by", exer_sort);
                    res.send(results);
                }
            });
    }

    //Orders data by inputted sort option when a search filter is a difficulty
    else if (isValid() && typeof (diffFlag) != 'undefined' && diffFlag.length > 0) {
        db.query("SELECT * FROM calisthenics WHERE exer_name LIKE " + diffFlag + " UNION SELECT * FROM calisthenics WHERE difficulty = " + diffFlag + " ORDER BY " + exer_sort, [diffFlag, exer_sort],
            (err, results, fields) => {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("difficulty search order by, exer_sort");
                    res.send(results);
                }
            });
    }

    //Orders data by inputted sort option when there is also a search filter
    else if (isValid() && typeof(searchFlag) != 'undefined' && searchFlag.length > 0) {;
        
        db.query("SELECT * FROM calisthenics WHERE exer_name LIKE " + searchFlag + " ORDER BY " + exer_sort, [searchFlag, exer_sort], (err, results, fields) => {
            if (err) {
                console.log(err);
            }
            else {
                //console.log("Search Result: ", results[0]);
                console.log("search order by", exer_sort);
                muscleFlag = "";
                diffFlag = "";
                res.send(results);
            }
        });
    }
    
    //If no sort option is selected, gets "default" table order
    //This is mostly for handling errors
    else {
        db.query("SELECT * FROM calisthenics ", (err, results, fields) => {
            if (err) {
                throw err;
            }
            //console.log("Search Result: ", results);
            res.send(results);
        });
    }
    
    
});

app.post('/sort', jsonParser, (req, res, next) => {
    const exer_sort = String(req.body.exer_sort);

    console.log("in normal sort exer_sort option: ", exer_sort)

    //Orders data by inputted sort option
    if (req.body.exer_sort.length != 0 && typeof(req.body.exer_sort) != 'undefined') {
            db.query("SELECT * FROM calisthenics ORDER BY " + exer_sort, [exer_sort], (err, results, fields) => {
                if (err) {
                    throw err;
                }
                //console.log("Search Result: ", results);
                res.send(results);
            });
    }

    //If no sort option is selected, gets "default" table order
    //This is mostly for handling errors

    else {
        db.query("SELECT * FROM calisthenics", (err, results, fields) => {
            if (err) {
                throw err;
            }
            //console.log("Search Result: ", results);
            res.send(results);
        });
    }
});

app.post('/register', jsonParser, (req, res, next) => {
    const userRegister = "\"" + String(req.body.user) + "\"";
    const passRegister = "\"" + String(req.body.pass) + "\"";
    const weightRegister = "\"" + String(req.body.weight) + "\"";

    db.query("SELECT * FROM users WHERE username = " + userRegister, [userRegister], (err, results, fields) => {
        console.log("select users");
        if (err) {
            throw err;
        }
        else if (typeof(results[0]) == 'undefined') {
            db.query("INSERT INTO users (username, userpass, bodyweight) VALUES (" + userRegister + "," + passRegister + "," + weightRegister + ")", [userRegister, passRegister, weightRegister],
            (err, results, fields) => {
                if (err) {
                    throw err;
                }
                console.log("User " + userRegister + " added");
                res.send(results);
            });
        }
        else {
            console.log("User exists");
        }
    });
});

app.post('/login', jsonParser, (req, res, next) => {
    const user = "\"" + String(req.body.user) + "\"";
    const pass = "\"" + String(req.body.pass) + "\"";

    db.query("SELECT * FROM users WHERE username = " + user + "AND " + "userpass = " + pass, [user, pass], (err, results, fields) => {
        if (err) {
            console.log("Login error")
            res.send({ Message: "Login error" });
        }
        else if (typeof(results[0]) != 'undefined' && results.length > 0) {
            console.log("result here", results[0]);
            console.log("Login success");
            res.send(results);
        }
        else {
            console.log("result else", results);
            res.send(results);
            console.log("Could not login");
        }
    });
});

app.post('/favorite', jsonParser, (req, res, next) => {
    const user = "\"" + String(req.body.user) + "\"";
    const fav_exer = "\"" + String(req.body.fav_exer) + "\"";
    var muscle;
    var difficulty;

    //Queries are nested because muscle and difficulty are only available within the scope of a query
    //When outside of the scope of a query they are set to undefined even if they were set in another query

    //Gets muscle and difficulty of a favorited exercise
    db.query("SELECT muscle, difficulty FROM calisthenics WHERE exer_name = " + fav_exer, [fav_exer],
        (err, results, fields) => {
            if (err) {
                console.log("Error getting muscle");
            }
            else if (typeof (results[0]) != 'undefined') {
                muscle = "\"" + String(results[0].muscle) + "\"";
                difficulty = "\"" + String(results[0].difficulty) + "\"";

                //Finds if user already had selected exercise favorited
                db.query("SELECT * FROM favorites WHERE username = " + user + " AND exer_name = " + fav_exer, [user, fav_exer],
                    (err, insert_results, fields) => {
                        if (err) {
                            console.log("error with get favorites, here are variables: ", user, fav_exer, muscle, difficulty);
                        }

                        else if (typeof (insert_results[0]) == 'undefined') {
                            //Insert selected exercise into favorites
                            db.query("INSERT INTO favorites(username, exer_name, muscle, difficulty) VALUES (" + user + "," + fav_exer + "," + muscle + "," + difficulty + ")", [user, fav_exer, muscle, difficulty],
                                (err, insert_results, fields) => {
                                    if (err) {
                                        console.log("error with get favorites, here are variables: ", user, fav_exer, muscle, difficulty);
                                    }
                                    else {
                                        console.log(user, " favorited ", fav_exer);
                                    }
                                }
                             );
                        }
                        else {
                            console.log(user + " already has " + fav_exer + " favorited");
                        }

                    }
                );
            }
        });
});

app.post('/getfavorite', jsonParser, (req, res, next) => {
    const user = "\"" + String(req.body.user) + "\"";

    db.query("SELECT * FROM favorites WHERE username = " + user, [user], (err, results, fields) => {
        if (err) {
            console.log("Error getting favorites")
        }
        else {
            //console.log("Favorites get");
            res.send(results);
            //console.log("results", results);
        }
    });
});

app.post('/deletefavorite', jsonParser, (req, res, next) => {
    const user = "\"" + String(req.body.user) + "\"";
    const fav_exer = "\"" + String(req.body.fav_exer) + "\"";

    db.query("DELETE FROM favorites WHERE username = " + user + " AND " + "exer_name = " + fav_exer, [user,fav_exer], (err, results, fields) => {
        if (err) {
            console.log("Error getting favorites")
        }
        else {
            console.log(user, " deleted ", fav_exer, " from favorites" );
            res.send(results);
            //console.log("results", results);
        }
    });
});

app.post('/sortfavorite', jsonParser, (req, res, next) => {
    const user = "\"" + String(req.body.user) + "\"";

    //Orders data by inputted sort option
    if (req.body.exer_sort != 0 && typeof (req.body.exer_sort) != 'undefined') {
        const exer_sort = String(req.body.exer_sort);
        db.query("SELECT * FROM favorites WHERE username = " + user + " ORDER BY " + exer_sort, [exer_sort, user], (err, results, fields) => {
            if (err) {
                throw err;
            }
            //console.log("Search Result: ", results);
            res.send(results);
        });
    }

    //If no sort option is selected, gets "default" table order
    //This is mostly for handling errors
    else {
        db.query("SELECT * FROM favorites WHERE username = " + user, [user], (err, results, fields) => {
            if (err) {
                throw err;
            }
            //console.log("Search Result: ", results);
            res.send(results);
        });
    }
});

app.post('/recommended', jsonParser, (req, res, next) => {
    const user = "\"" + String(req.body.user) + "\"";

    db.query("SELECT DISTINCT B.* FROM favorites A JOIN calisthenics B WHERE A.muscle = B.muscle AND A.difficulty = B.difficulty AND A.username = " + user, [user], (err, results, fields) => {
        if (err) {
            console.log("Error getting favorites")
        }
        else {
            //console.log("Recommended get");
            res.send(results);
            //console.log("results", results);
        }
    });
});

app.post('/sortrecommended', jsonParser, (req, res, next) => {
    const user = "\"" + String(req.body.user) + "\"";

    //Orders data by inputted sort option
    if (req.body.exer_sort.length != 0 && typeof (req.body.exer_sort) != 'undefined') {
        const exer_sort = String(req.body.exer_sort);
        console.log("sort", exer_sort);
        db.query("SELECT DISTINCT B.* FROM favorites A JOIN calisthenics B WHERE A.muscle = B.muscle AND A.difficulty = B.difficulty AND A.username = " + user + " ORDER BY " + exer_sort, [user, exer_sort],
            (err, results, fields) => {
                if (err) {
                    throw err;
                }
                //console.log("Search Result: ", results);
                res.send(results);
        });
    }

    //If no sort option is selected, gets "default" table order
    //This is mostly for handling errors
    else {
        db.query("SELECT DISTINCT B.* FROM favorites A JOIN calisthenics B WHERE A.muscle = B.muscle AND A.difficulty = B.difficulty AND A.username = " + user, [user], (err, results, fields) => {
            if (err) {
                throw err;
            }
            //console.log("Search Result: ", results);
            res.send(results);
        });
    }
});
