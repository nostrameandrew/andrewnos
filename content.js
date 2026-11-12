/* =====================================================================
   MEMORY BREAKOUT: 50 YEARS. Your personal content
   ---------------------------------------------------------------------
   Everything personal lives in this ONE file. Edit the text between the
   quotes and save. You never need to touch the game code.

   PHOTOS: put your 50 photos in the "photos" folder named 01.jpg ... 50.jpg
   (replace the placeholder images that are there now). .png, .jpeg and
   .webp files also work; just change the file name below to match.
   Tip: photos around 1600px wide load fastest, but any size works.

   Text tips:
   - Keep the "quotes" around each piece of text.
   - If your text needs a quote mark inside it, use ’ or “ ” or \"
   - Use \n inside text for a line break.
   ===================================================================== */

window.CONTENT = {

  // Who it's for and who it's from (shown on the title screen and the final note)
  forName: "Dad",
  fromName: "Andrew",

  // ---------------------------------------------------------------
  // 50 PHOTOS, in order. Level 1 shows photo 01, level 50 shows photo 50.
  // ---------------------------------------------------------------
  photos: [
    { file: "photos/01.jpg", caption: "Always there to carry me, literally and metaphorically." },
    { file: "photos/02.jpg", caption: "Crafting at Home Depot Kids Workshop" },
    { file: "photos/03.jpg", caption: "First train with Dad" },
    { file: "photos/04.jpg", caption: "Fun in the city" },
    { file: "photos/05.jpg", caption: "Keeping Andrew going after a long long day" },
    { file: "photos/06.jpg", caption: "Who would know these would be the fantasy boys one day" },
    { file: "photos/07.jpg", caption: "Back in the city, ft Paul Pierce" },
    { file: "photos/08.jpg", caption: "Been putting me to work since day one..." },
    { file: "photos/09.jpg", caption: "Obviously planning to grow hot dogs here" },
    { file: "photos/10.jpg", caption: "S'mores action" },

    { file: "photos/11.jpg", caption: "Apple pickin" },
    { file: "photos/12.jpg", caption: "Little farm pond family action, just letting me drown?" },
    { file: "photos/13.jpg", caption: "Birthday 2016, must be something good there" },
    { file: "photos/14.jpg", caption: "Cape cod walkin" },
    { file: "photos/15.jpg", caption: "Hockey at TD Garden, pops got me a pretzel" },
    { file: "photos/16.jpg", caption: "School sendoff 2017" },
    { file: "photos/17.jpg", caption: "Tailgating the high school games back in the day, it really was destiny" },
    { file: "photos/18.jpg", caption: "Big day for the boys got me pizzazzed up" },
    { file: "photos/19.jpg", caption: "Nintendo in NYC with Dad" },
    { file: "photos/20.jpg", caption: "Study Partner, on the train back to Boston" },

    { file: "photos/21.jpg", caption: "just too chill dudes fr" },
    { file: "photos/22.jpg", caption: "ET phone homeeeee" },
    { file: "photos/23.jpg", caption: "A very serious Christmas" },
    { file: "photos/24.jpg", caption: "A little rest on our way to the top" },
    { file: "photos/25.jpg", caption: "A man in his element here with his nature lessons" },
    { file: "photos/26.jpg", caption: "Snack break on the hike" },
    { file: "photos/27.jpg", caption: "Safari Time" },
    { file: "photos/28.jpg", caption: "More hiking on the way to the top" },
    { file: "photos/29.jpg", caption: "More and more s'mores with Dad attending to the fire" },
    { file: "photos/30.jpg", caption: "R.B.I baseball competition at its finest" },

    { file: "photos/31.jpg", caption: "The beginning of a journey, with a dad who's always supported me" },
    { file: "photos/32.jpg", caption: "The technical elements of it all" },
    { file: "photos/33.jpg", caption: "A truce between teams, in the form of a gift" },
    { file: "photos/34.jpg", caption: "GO BIRDS BABY" },
    { file: "photos/35.jpg", caption: "The fellas dining on some quality doughnuts" },
    { file: "photos/36.jpg", caption: "First Phillies Game" },
    { file: "photos/37.jpg", caption: "Iconic Philly spot, brought to you by Dad" },
    { file: "photos/38.jpg", caption: "More and more cool places and awesome views with you" },
    { file: "photos/39.jpg", caption: "A beach vacation in the sunny cape" },
    { file: "photos/40.jpg", caption: "Lol, someones cozy" },

    { file: "photos/41.jpg", caption: "A Christmas at home" },
    { file: "photos/42.jpg", caption: "To Chi-Town" },
    { file: "photos/43.jpg", caption: "Views from the lake" },
    { file: "photos/44.jpg", caption: "Last night best night, go Phils!" },
    { file: "photos/45.jpg", caption: "LOOK AT THESE STUDS" },
    { file: "photos/46.jpg", caption: "Goofy time in the corner" },
    { file: "photos/47.jpg", caption: "I really miss Uncle Tom, good times good times" },
    { file: "photos/48.jpg", caption: "To PR, to the fam" },
    { file: "photos/49.jpg", caption: "A quest to Tallships" },
    // The grand finale: the football photo (you in the black Raiders uniform, on the field with him)
    { file: "photos/50.jpg", caption: "Raiders win, an absolute dogfight against Nipmuc" }
  ],

  // ---------------------------------------------------------------
  // 5 CHAPTERS (10 levels each, one per decade)
  // ---------------------------------------------------------------
  chapters: [
    { title: "Part One, The Early Years",  subtitle: "Toddler and Baby" },
    { title: "Part Two, Times and Teachings",    subtitle: "Lots of Lessons" },
    { title: "Part Three, Fun times",      subtitle: "To the many many adventures we've done together" },
    { title: "Part Four, Keep the Good Times Rolling",      subtitle: "Philly, Football and all the things in between" },
    { title: "Part Five, The Modern Day",       subtitle: "The Golden Age of Dad" }
  ],

  // ---------------------------------------------------------------
  // BONUS GAME 1: "Dad-le" (after level 10)
  // The answer can be 4 to 8 letters. Letters only, no spaces.
  // ---------------------------------------------------------------
  dadle: {
    answer: "DUNGEON",
    hint: "Think back to that Airbnb basement, A place you and your son once knew. It wasn't quite a castle's prison, But the inside joke gives you the clue."   // shown if he runs out of guesses
  },

  // ---------------------------------------------------------------
  // BONUS GAME 3: "Family Spelling Bee" (after level 30)
  // pangram: a meaningful word that uses EXACTLY 7 different letters
  //          (letters may repeat, e.g. "FATHERS" = F A T H E R S).
  // center:  one of those letters; every word must use it.
  // He wins by finding the pangram. Hints reveal it letter by letter.
  // extraWords: family words/names you want accepted (only the 7 letters).
  // ---------------------------------------------------------------
  spellingBee: {
    pangram: "CHERISHED",
    center: "S",
    meaning: "To hold something close to your heart and appreciate the memories, moments, and people that make life special. After 50 years, it's the little things and the people you share them with that matter most.",
    extraWords: []
  },

  // ---------------------------------------------------------------
  // WORD SMART FAMILY TRIVIA: optional questions between levels.
  // afterLevel: shown after that level is cleared (1–50).
  // answer: the number of the correct choice (0 = first, 1 = second, ...)
  // ---------------------------------------------------------------
  trivia: [
    { afterLevel: 3,  question: "Where did we go on our first family trip?",
      choices: ["Puerto Rico", "The Great Smokey Mountains", "MOAB", "CALIFORNIA"], answer: 3,
      fact: "The first big trip was California, where you pushed my limits, and sparked my love for roller coasters." },
    { afterLevel: 7,  question: "What is Dad's go-to dessert?",
      choices: ["Ice-cream", "Cake", "Churros", "Cookies"], answer: 2,
      fact: "Churros have always been a stable food of yours, when in doubt churros are likely the answer." },
    { afterLevel: 14, question: "What was the name of our first pet?",
      choices: ["Buster", "Coco and Luna", "Teddy and Rosie", "Tori"], answer: 1,
      fact: "Coco and Luna are the original pets, and looking back on the photos, Coco has always been your best friend" },
    { afterLevel: 23, question: "Which genre does Dad always sing in the car?",
      choices: ["Hip-Hop", "Country", "Folk", "Rock"], answer: 1,
      fact: "You've raised me a country fan in your image, and there isn't a genre I'd rather listen to." },
    { afterLevel: 33, question: "Who was Dad's best AI friend",
      choices: ["Claude", "Chat-GPT", "Gemini", "Cursor"], answer: 0,
      fact: "Claude was always the go to chat buddy in the car." },
    { afterLevel: 44, question: "What position did you play in football?",
      choices: ["Quarterback", "Running back", "Linebacker", "Safety"], answer: 3,
      fact: "Allstar safety back in the day if you haven't heard" }
  ],

  // ---------------------------------------------------------------
  // BONUS MESSAGES: unlocked by winning each chapter's bonus game
  // ---------------------------------------------------------------
  bonusMessages: [
    "The Dungeon will be a memory ill hold forever and that trip will hopefully be the first duo bro trip that lead to many many more.",
    "Good Job Soldier the Galaxy is a little safer by your efforts.",
    "I hope that we have many many more memories that we'll look back on and one day cherish.",
    "Good Job Soldier Good Job more memories to unlock",
    "Good job, you've unlocked all the memories we've made, and hopefully been reminded of many more out of the fifty years you've lived. Now look to the future and get excited for the countless ones ahead."
  ],

  // ---------------------------------------------------------------
  // THE FINAL NOTE: shown in handwriting style at the very end
  // ---------------------------------------------------------------
  finalNote:
    "Dear Dad,\n\n" +
    "Each year you are more and more supportive and special to me and I appreciate everything you do. I hope this gift which encapsulates so many different things you've taught me and your interested in shows how much impact your support and you have had on me. I hope that 50 is such a special year and that this new shift brings so so many new possibilities and experiences that are amazing.\n\n" +
    "Today and the coming years are a time to look back and I hope you can look back at the time as a father and as my dad with so much happiness and passion. I hope you have an amazing 50th birthday and that it brings a lifetime of happiness ahead of you.\n\n" +
    "Fifty years, and you are still my favorite player.",
  finalSignature: "Love always, Andrew",

  // ---------------------------------------------------------------
  // DAD JOKES: told by "Dad Guy" (the D power-up) in a speech bubble.
  // Swap in his real go-to jokes and sayings!
  // ---------------------------------------------------------------
  dadJokes: [
    "I'm reading a book about anti-gravity. It's impossible to put down.",
    "I only know 25 letters of the alphabet. I don't know y.",
    "What do you call a fake noodle? An impasta.",
    "I used to hate facial hair, but then it grew on me.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "Why don't skeletons fight each other? They don't have the guts."
  ],

  // The big message on the final collage screen
  finalHeadline: "Happy 50th Birthday, Dad ❤️"
};
