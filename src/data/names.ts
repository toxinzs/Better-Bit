import { Gender, RegionKey } from "../types";

export type NamePool = {
  male: string[];
  female: string[];
  neutral: string[];
  last: string[];
};

// Real, region-appropriate names. Pools are de-duplicated at load so a name
// listed twice can never skew the odds.
const uniq = (names: string[]): string[] => Array.from(new Set(names));

const pool = (p: NamePool): NamePool => ({
  male: uniq(p.male),
  female: uniq(p.female),
  neutral: uniq(p.neutral),
  last: uniq(p.last),
});

export const NAME_POOLS: Record<RegionKey, NamePool> = {
  us: pool({
    male: [
      "James", "Michael", "Daniel", "Marcus", "Andre", "Elijah", "Noah", "Malik", "Ethan", "Jayden",
      "Isaiah", "Omar", "Lucas", "Xavier", "Anthony", "David", "Jordan", "Kevin", "William", "Benjamin",
      "Mason", "Logan", "Liam", "Aiden", "Caleb", "Tyler", "Brandon", "Justin", "Jamal", "Darius",
      "DeShawn", "Terrell", "Tyrone", "Malcolm", "Jalen", "Devin", "Trevor", "Cameron", "Christopher", "Joshua",
      "Matthew", "Andrew", "Joseph", "Ryan", "Nathan", "Dylan", "Hunter", "Austin", "Connor", "Carlos",
      "Diego", "Mateo", "Miguel", "Javier", "Luis", "Jose", "Angel", "Adrian", "Ivan", "Hector",
      "Victor", "Raymond", "Frank", "Henry", "Jack", "Samuel", "Gabriel", "Julian", "Isaac", "Levi",
      "Ezra", "Miles", "Jaylen", "Marquis", "Cedric", "Reggie", "Dominic", "Vincent", "Tony", "Sean",
      "Patrick", "Kyle", "Zachary", "Eric", "Steven", "Brian", "Jason", "Timothy", "Jeremiah", "Amir",
      "Rashad", "Khalil", "Tariq", "Kareem", "Jerome", "Terrance", "Derrick", "Antoine", "Lamar", "Quincy",
      "Corey", "Kenneth", "Chase", "Colton", "Wyatt", "Grant", "Nolan", "Cole", "Bryce", "Trey",
      "Ricky", "Manny", "Tommy", "Bobby", "Elliot", "Emmanuel", "Damien", "Desmond", "Gregory", "Walter",
    ],
    female: [
      "Amara", "Sophia", "Aaliyah", "Maya", "Zoe", "Destiny", "Jasmine", "Nia", "Layla", "Chloe",
      "Imani", "Serenity", "Camille", "Aria", "Jada", "Mia", "Alexis", "Brianna", "Emma", "Olivia",
      "Ava", "Isabella", "Charlotte", "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Sofia",
      "Avery", "Ella", "Scarlett", "Grace", "Lily", "Hannah", "Natalie", "Zoey", "Leah", "Hazel",
      "Violet", "Aurora", "Savannah", "Brooklyn", "Kayla", "Ashley", "Jessica", "Taylor", "Tiara", "Keisha",
      "Latoya", "Ebony", "Diamond", "Kiara", "Monique", "Jaylah", "Nyla", "Simone", "Tamika", "Shaniqua",
      "Ciara", "Danielle", "Gabrielle", "Alicia", "Valeria", "Camila", "Lucia", "Ximena", "Daniela", "Mariana",
      "Paola", "Carmen", "Rosa", "Elena", "Ana", "Sara", "Rachel", "Rebecca", "Megan", "Lauren",
      "Samantha", "Morgan", "Kennedy", "Reagan", "Paisley", "Nevaeh", "Genesis", "Trinity", "Faith", "Hope",
      "Joy", "Angelina", "Bianca", "Talia", "Naomi", "Ruth", "Tessa", "Kimberly", "Michelle", "Tiffany",
      "Vanessa", "Nadia", "Yasmin", "Layne", "Alana", "Brielle", "Delilah", "Jocelyn", "Miranda", "Whitney",
    ],
    neutral: [
      "River", "Quinn", "Sage", "Rowan", "Skyler", "Phoenix", "Ari", "Jordan", "Taylor", "Casey",
      "Riley", "Avery", "Dakota", "Emerson", "Finley", "Harper", "Hayden", "Jamie", "Kai", "Logan",
      "Micah", "Parker", "Reese", "Remy", "Sasha", "Blake", "Cameron", "Devon", "Lane", "Peyton",
    ],
    last: [
      "Johnson", "Williams", "Brooks", "Carter", "Bennett", "Reyes", "Coleman", "Diallo", "Okafor", "Price",
      "Sinclair", "Harmon", "Mercer", "Alston", "Whitfield", "Rodriguez", "Nguyen", "Kim", "Smith", "Brown",
      "Jones", "Davis", "Miller", "Wilson", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin",
      "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Lewis", "Lee", "Walker", "Hall", "Allen",
      "Young", "King", "Wright", "Scott", "Torres", "Hill", "Green", "Adams", "Baker", "Nelson",
      "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
      "Stewart", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Cooper",
      "Richardson", "Cox", "Howard", "Ward", "Flores", "Washington", "Butler", "Simmons", "Foster", "Bryant",
      "Alexander", "Russell", "Griffin", "Hayes", "Myers", "Ford", "Hamilton", "Graham", "Sullivan", "Wallace",
      "Woods", "Cole", "West", "Jordan", "Owens", "Reynolds", "Fisher", "Ellis", "Harrison", "Gibson",
      "Mendoza", "Ruiz", "Hernandez", "Gonzalez", "Ramirez", "Chavez", "Patel", "Shah", "Chen", "Wong",
      "Tran", "Park", "Cohen", "Rossi", "Kowalski", "O'Brien", "Sanders", "Bryant", "Freeman", "Banks",
    ],
  }),
  uk: pool({
    male: [
      "Oliver", "George", "Harry", "Jack", "Charlie", "Thomas", "Freddie", "Alfie", "William", "Archie",
      "Leo", "Arthur", "Oscar", "Reuben", "Finley", "Jamie", "Callum", "Rhys", "Noah", "Henry",
      "Theodore", "Joshua", "Jacob", "Muhammad", "Ethan", "Lewis", "Alexander", "Max", "Harrison", "Riley",
      "Edward", "Samuel", "Daniel", "Joseph", "Benjamin", "Isaac", "Mason", "Logan", "Dylan", "Ryan",
      "Owen", "Connor", "Liam", "Harvey", "Elliot", "Toby", "Ronnie", "Stanley", "Albie", "Teddy",
      "Louie", "Jenson", "Bobby", "Mohammed", "Ibrahim", "Hamza", "Ali", "Yusuf", "Zayn", "Aiden",
      "Cameron", "Jayden", "Kai", "Tyler", "Ellis", "Frankie", "Hugo", "Felix", "Sebastian", "Dexter",
      "Nathan", "Adam", "Luke", "Ben", "Josh", "Sam", "Dan", "Matty", "Aaron", "Gareth",
      "Owain", "Dafydd", "Iwan", "Rhodri", "Ewan", "Angus", "Fraser", "Callan", "Craig", "Kieran",
      "Declan", "Cian", "Padraig", "Seamus", "Niall", "Ciaran", "Tommy", "Ollie", "Rory", "Rupert",
    ],
    female: [
      "Olivia", "Amelia", "Isla", "Ava", "Emily", "Sophia", "Grace", "Lily", "Freya", "Charlotte",
      "Poppy", "Evie", "Willow", "Daisy", "Ruby", "Phoebe", "Elsie", "Matilda", "Isabella", "Sophie",
      "Mia", "Ella", "Jessica", "Florence", "Alice", "Ivy", "Rosie", "Harper", "Millie", "Lola",
      "Holly", "Georgia", "Lucy", "Layla", "Maya", "Erin", "Imogen", "Esme", "Hallie", "Penelope",
      "Eva", "Emilia", "Chloe", "Lottie", "Bella", "Sienna", "Maisie", "Summer", "Darcie", "Bethany",
      "Aisha", "Fatima", "Zara", "Maryam", "Amira", "Aaliyah", "Leah", "Hannah", "Megan", "Jasmine",
      "Molly", "Abigail", "Katie", "Beth", "Ffion", "Cerys", "Seren", "Nia", "Eluned", "Catrin",
      "Eilidh", "Morag", "Isla-Rose", "Fiona", "Kirsty", "Shona", "Niamh", "Aoife", "Siobhan", "Orla",
      "Saoirse", "Caoimhe", "Roisin", "Tia", "Kayleigh", "Chelsea", "Courtney", "Shannon", "Amber", "Paige",
      "Rebecca", "Hollie", "Lauren", "Natasha", "Victoria", "Harriet", "Beatrice", "Clementine", "Cecily", "Genevieve",
    ],
    neutral: [
      "Alex", "Charlie", "Jordan", "Robin", "Frankie", "Morgan", "Ashley", "Sam", "Jamie", "Taylor",
      "Riley", "Casey", "Jesse", "Kai", "Lee", "Leslie", "Max", "Billie", "Bobbie", "Cameron",
      "Drew", "Elliot", "Hayden", "Jules", "Kit", "Lou", "Noel", "Reese", "Sasha", "Skye",
    ],
    last: [
      "Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Evans", "Thomas",
      "Roberts", "Walker", "Wright", "Robinson", "Thompson", "White", "Hughes", "Edwards", "Green", "Hall",
      "Wood", "Harris", "Lewis", "Martin", "Jackson", "Clarke", "Clark", "Turner", "Hill", "Scott",
      "Cooper", "Morris", "Ward", "Moore", "King", "Watson", "Baker", "Harrison", "Morgan", "Patel",
      "Young", "Allen", "Mitchell", "James", "Anderson", "Phillips", "Lee", "Bell", "Parker", "Davis",
      "Bailey", "Cook", "Shaw", "Price", "Bennett", "Carter", "Richardson", "Griffiths", "Murphy", "Kelly",
      "Khan", "Ali", "Ahmed", "Hussain", "Begum", "Singh", "Kaur", "Sharma", "Chowdhury", "Rahman",
      "MacDonald", "Campbell", "Stewart", "Robertson", "Murray", "Reid", "Fraser", "Ross", "Sinclair", "Ferguson",
      "O'Connor", "O'Neill", "Byrne", "Doyle", "Walsh", "Gallagher", "Sullivan", "Quinn", "Kennedy", "Fitzgerald",
      "Pritchard", "Rees", "Powell", "Howells", "Bevan", "Owen", "Jenkins", "Lloyd", "Pugh", "Morgan",
      "Fletcher", "Hartley", "Whittaker", "Ashworth", "Holt", "Booth", "Chapman", "Fox", "Gibson", "Hunt",
      "Marshall", "Mason", "Palmer", "Pearson", "Rhodes", "Saunders", "Stevens", "Webb", "Wells", "Newton",
    ],
  }),
  nigeria: pool({
    male: [
      "Chinedu", "Oluwaseun", "Emeka", "Babajide", "Ikenna", "Tunde", "Chibuike", "Ayodele", "Obinna", "Femi",
      "Segun", "Uchenna", "Kelechi", "Damilare", "Chidi", "Olamide", "Nnamdi", "Gbenga", "Chukwuemeka", "Ifeanyi",
      "Nonso", "Chijioke", "Ugochukwu", "Onyekachi", "Ebuka", "Tochukwu", "Somto", "Kene", "Arinze", "Ikechukwu",
      "Olumide", "Adewale", "Ayomide", "Oluwatobi", "Temitope", "Babatunde", "Adebayo", "Kayode", "Rotimi", "Sola",
      "Dapo", "Tosin", "Yinka", "Bolaji", "Folarin", "Lekan", "Niyi", "Seyi", "Wale", "Dayo",
      "Ademola", "Akin", "Olusegun", "Oluwafemi", "Toluwalase", "Ibrahim", "Musa", "Abubakar", "Usman", "Aminu",
      "Sani", "Yusuf", "Bashir", "Garba", "Hassan", "Ismail", "Mohammed", "Suleiman", "Abdullahi", "Aliyu",
      "Umar", "Danjuma", "Bulus", "Gideon", "Istifanus", "Joshua", "Emmanuel", "Daniel", "Samuel", "David",
      "Etim", "Ekpo", "Emem", "Ubong", "Idara", "Efe", "Ovie", "Tega", "Erhun", "Osaze",
      "Ejike", "Ogechi", "Uzoma", "Afam", "Ndubuisi", "Obiora", "Chinonso", "Kosisochukwu", "Amaechi", "Nwabueze",
    ],
    female: [
      "Chiamaka", "Ngozi", "Adaeze", "Folake", "Amarachi", "Yetunde", "Chidinma", "Adaobi", "Ifeoma", "Zainab",
      "Temitope", "Bukola", "Nkechi", "Aisha", "Olamide", "Funmilayo", "Ejiro", "Chinyere", "Oluwakemi", "Titilayo",
      "Omolara", "Abimbola", "Adeola", "Damilola", "Morenike", "Modupe", "Ronke", "Yemisi", "Bisola", "Toyin",
      "Funke", "Kemi", "Shade", "Sade", "Iyabo", "Bunmi", "Tolani", "Tinuke", "Ayomide", "Oyinkansola",
      "Ifunanya", "Uchechi", "Nneka", "Chioma", "Ogechi", "Ebele", "Obioma", "Nkiru", "Ijeoma", "Amaka",
      "Onyinye", "Kelechukwu", "Adanna", "Ugonna", "Nnenna", "Ozioma", "Somkene", "Kamsi", "Chisom", "Munachi",
      "Fatima", "Hauwa", "Khadija", "Maryam", "Halima", "Hadiza", "Rukayya", "Amina", "Safiya", "Binta",
      "Asma'u", "Zulai", "Rabi", "Aishatu", "Nafisa", "Jamila", "Ramatu", "Hafsat", "Ummi", "Zahra",
      "Blessing", "Grace", "Precious", "Favour", "Mercy", "Patience", "Joy", "Faith", "Esther", "Ruth",
      "Efiong", "Enobong", "Iniobong", "Mfon", "Ekaette", "Aniekan", "Imaobong", "Uduak", "Eno", "Nsikak",
    ],
    neutral: [
      "Tobi", "Uche", "Chidi", "Ndidi", "Kemi", "Simi", "Ike", "Ade", "Ola", "Dayo",
      "Efe", "Ese", "Tari", "Tega", "Ify", "Nonso", "Kene", "Somto", "Kachi", "Ogo",
      "Wale", "Yemi", "Femi", "Bola", "Tosin", "Lade", "Ejike", "Emem", "Ubong", "Mfon",
    ],
    last: [
      "Okafor", "Adeyemi", "Eze", "Balogun", "Nwosu", "Okonkwo", "Abubakar", "Chukwu", "Adebayo", "Ibrahim",
      "Okoro", "Afolabi", "Ogunleye", "Nnaji", "Musa", "Oladipo", "Eneh", "Bello", "Adeleke", "Adewale",
      "Ajayi", "Akinola", "Akintola", "Aluko", "Amadi", "Anyanwu", "Ayodele", "Babatunde", "Bakare", "Coker",
      "Dada", "Danjuma", "Ekwueme", "Emenike", "Eze", "Fashola", "Folarin", "Garba", "Hassan", "Idowu",
      "Igwe", "Ihejirika", "Ikpeazu", "Ilori", "Isiaka", "Jimoh", "Kalu", "Lawal", "Madu", "Mba",
      "Mohammed", "Nwachukwu", "Nwankwo", "Nwafor", "Nwobodo", "Obi", "Obiora", "Odunsi", "Ogbonna", "Ogundipe",
      "Ojo", "Okeke", "Okon", "Olawale", "Oleru", "Oluwole", "Onyeama", "Onwuka", "Onyekwere", "Opara",
      "Osagie", "Oshodi", "Owolabi", "Salami", "Sanni", "Shehu", "Sule", "Suleiman", "Tijani", "Udoh",
      "Uche", "Ugwu", "Umeh", "Usman", "Williams", "Yakubu", "Yusuf", "Adegoke", "Adesanya", "Agbaje",
      "Agu", "Aina", "Ajibola", "Akande", "Akpan", "Alabi", "Ani", "Asuquo", "Bassey", "Duke",
      "Edem", "Effiong", "Etim", "Ekong", "Ezekiel", "Gbadamosi", "Ogunbanjo", "Oyelaran", "Uzor", "Wogu",
    ],
  }),
  japan: pool({
    male: [
      "Haruto", "Sota", "Yuto", "Ren", "Riku", "Sora", "Kaito", "Yuki", "Hayato", "Tsubasa",
      "Kenji", "Takumi", "Daiki", "Shota", "Ryo", "Kazuki", "Naoki", "Yamato", "Minato", "Asahi",
      "Hinata", "Itsuki", "Yuma", "Ryota", "Kota", "Sho", "Shun", "Takeru", "Tatsuki", "Toma",
      "Hiroto", "Hiroshi", "Takashi", "Akira", "Satoshi", "Kenta", "Kento", "Yusuke", "Daisuke", "Masaru",
      "Makoto", "Noboru", "Osamu", "Isamu", "Shinji", "Shingo", "Tetsuya", "Tomoya", "Yoshiki", "Yoshito",
      "Haruki", "Hayate", "Junpei", "Kaede", "Keita", "Koji", "Kosuke", "Kyo", "Manabu", "Masato",
      "Mitsuru", "Nao", "Nobuhiro", "Reo", "Rin", "Ryuji", "Ryusei", "Seiji", "Shinichi", "Soichiro",
      "Sosuke", "Taiga", "Taiki", "Taro", "Teruo", "Tsuyoshi", "Yasuo", "Yoshio", "Yuji", "Yukio",
      "Kazuo", "Minoru", "Tadashi", "Hideo", "Eiji", "Goro", "Jiro", "Saburo", "Ichiro", "Kenichi",
      "Ryoma", "Sakuya", "Tomoki", "Wataru", "Yuta", "Yuya", "Aoto", "Haruma", "Kouki", "Rikuto",
    ],
    female: [
      "Yui", "Aoi", "Hina", "Sakura", "Yuna", "Mei", "Rin", "Akari", "Koharu", "Himari",
      "Nanami", "Saki", "Miyu", "Kokoro", "Ayaka", "Riko", "Hana", "Yume", "Mio", "Sara",
      "Ichika", "Tsumugi", "Mitsuki", "Honoka", "Haruka", "Misaki", "Momoka", "Nana", "Airi", "Ayane",
      "Emi", "Erika", "Fumika", "Kanna", "Karen", "Kaho", "Kaori", "Kasumi", "Kyoko", "Mai",
      "Manami", "Mayu", "Megumi", "Miku", "Minami", "Miyuki", "Moe", "Momo", "Nao", "Natsuki",
      "Noa", "Noriko", "Reina", "Rika", "Rina", "Risa", "Sae", "Sakiko", "Satomi", "Sayaka",
      "Shiori", "Shizuka", "Sumire", "Suzu", "Tomoko", "Tsubaki", "Yoko", "Yoshiko", "Yukari", "Yuki",
      "Yumi", "Yuriko", "Chihiro", "Chiyo", "Fuka", "Hikari", "Hinako", "Hitomi", "Izumi", "Kana",
      "Kimiko", "Kotone", "Kurumi", "Machi", "Michiko", "Nagisa", "Naomi", "Sachiko", "Setsuko", "Tamaki",
      "Akiko", "Ayumi", "Eri", "Haru", "Kiyomi", "Mariko", "Reiko", "Sayuri", "Taeko", "Yasuko",
    ],
    neutral: [
      "Hikaru", "Kaoru", "Makoto", "Tsukasa", "Akira", "Sora", "Yuu", "Haru", "Nao", "Ai",
      "Aki", "Asahi", "Chihiro", "Hinata", "Izumi", "Kei", "Kou", "Mahiro", "Michi", "Mizuki",
      "Rei", "Ren", "Riku", "Rio", "Sakae", "Shinobu", "Yuzu", "Yuki", "Minato", "Kanade",
    ],
    last: [
      "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
      "Yoshida", "Yamada", "Sasaki", "Matsumoto", "Inoue", "Kimura", "Hayashi", "Saito", "Shimizu", "Yamaguchi",
      "Matsuda", "Ikeda", "Hashimoto", "Abe", "Ishikawa", "Ogawa", "Goto", "Okada", "Hasegawa", "Murakami",
      "Kondo", "Ishii", "Sakamoto", "Endo", "Aoki", "Fujii", "Nishimura", "Fukuda", "Ota", "Miura",
      "Fujita", "Okamoto", "Matsuoka", "Nakagawa", "Nakano", "Harada", "Ono", "Tamura", "Takeuchi", "Kaneko",
      "Wada", "Nakajima", "Ishida", "Ueda", "Morita", "Hara", "Shibata", "Sakai", "Kudo", "Yokoyama",
      "Miyazaki", "Miyamoto", "Uchida", "Takagi", "Ando", "Taniguchi", "Ohno", "Maruyama", "Imai", "Takada",
      "Fujimoto", "Takeda", "Murata", "Ueno", "Sugiyama", "Masuda", "Sugawara", "Hirano", "Kojima", "Otsuka",
      "Chiba", "Kubo", "Matsui", "Iwasaki", "Sakurai", "Kinoshita", "Noguchi", "Matsuo", "Nomura", "Kikuchi",
      "Sano", "Onishi", "Sugimoto", "Arai", "Hamada", "Shimada", "Yamazaki", "Mori", "Ogawa", "Nagai",
      "Tsuchiya", "Konishi", "Yoshikawa", "Kawasaki", "Kawamura", "Oshima", "Hirose", "Nishida", "Tsukamoto", "Iida",
    ],
  }),
  brazil: pool({
    male: [
      "Gabriel", "Miguel", "Arthur", "Heitor", "Davi", "Lorenzo", "Theo", "Pedro", "Gustavo", "Rafael",
      "Bernardo", "Enzo", "Matheus", "Bruno", "Caio", "Vinícius", "Thiago", "Felipe", "Samuel", "Nicolas",
      "Lucas", "João", "Guilherme", "Daniel", "Henrique", "Murilo", "Eduardo", "Leonardo", "Gael", "Benício",
      "Lucca", "Otávio", "Yuri", "Erick", "Diego", "Ryan", "Cauã", "Antônio", "José", "Carlos",
      "Paulo", "Ricardo", "Fernando", "Rodrigo", "Marcelo", "Leandro", "Fábio", "Márcio", "Renato", "Sérgio",
      "Anderson", "André", "Alexandre", "Adriano", "Alan", "Douglas", "Elias", "Emanuel", "Fabrício", "Gabriel",
      "Igor", "Jonas", "Júlio", "Kaique", "Lázaro", "Leonel", "Luan", "Luiz", "Marcos", "Mário",
      "Nelson", "Nathan", "Oliver", "Pablo", "Raul", "Renan", "Roberto", "Rogério", "Ronaldo", "Sandro",
      "Tadeu", "Tiago", "Valter", "Wagner", "Washington", "Wesley", "Wellington", "Willian", "Vitor", "Vicente",
      "Joaquim", "Francisco", "Augusto", "Cristiano", "Diogo", "Edson", "Flávio", "Geraldo", "Hugo", "Jorge",
    ],
    female: [
      "Alice", "Sophia", "Helena", "Valentina", "Laura", "Isabella", "Manuela", "Júlia", "Heloísa", "Luiza",
      "Beatriz", "Larissa", "Camila", "Fernanda", "Lívia", "Marina", "Giovanna", "Yasmin", "Maria", "Ana",
      "Clara", "Cecília", "Lorena", "Lara", "Melissa", "Isadora", "Antonella", "Eloá", "Maitê", "Sarah",
      "Rafaela", "Lavínia", "Mariana", "Emanuelly", "Gabriela", "Ágatha", "Bianca", "Letícia", "Amanda", "Carolina",
      "Juliana", "Patrícia", "Vanessa", "Aline", "Bruna", "Carla", "Daniela", "Débora", "Elaine", "Fabiana",
      "Flávia", "Gisele", "Jéssica", "Joana", "Karina", "Luana", "Luciana", "Márcia", "Mônica", "Natália",
      "Priscila", "Renata", "Roberta", "Rosana", "Sandra", "Simone", "Sônia", "Tatiane", "Thaís", "Viviane",
      "Adriana", "Andréia", "Bárbara", "Cláudia", "Cristina", "Denise", "Eliane", "Érica", "Fátima", "Graziela",
      "Ingrid", "Jaqueline", "Kátia", "Lúcia", "Marta", "Michele", "Nádia", "Paula", "Raquel", "Regina",
      "Rita", "Silvia", "Tânia", "Vera", "Yara", "Zilda", "Nicole", "Stella", "Olívia", "Pietra",
    ],
    neutral: [
      "Ariel", "Noah", "Cauã", "Emanuel", "Guilherme", "Sol", "Ivi", "Alex", "Gabi", "Dani",
      "Nicky", "Cris", "Fran", "Jô", "Lu", "Mica", "Pri", "Rafa", "Sasha", "Téo",
      "Vic", "Kim", "Lee", "Jordan", "Robin", "Charlie", "Ícaro", "Aurora", "Milo", "Nino",
    ],
    last: [
      "Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Almeida", "Rodrigues", "Ferreira", "Carvalho",
      "Gomes", "Martins", "Araújo", "Melo", "Barbosa", "Ribeiro", "Alves", "Monteiro", "Lima", "Cardoso",
      "Rocha", "Dias", "Teixeira", "Fernandes", "Moreira", "Correia", "Mendes", "Nascimento", "Nunes", "Freitas",
      "Andrade", "Batista", "Campos", "Castro", "Cavalcanti", "Coelho", "Duarte", "Farias", "Fonseca", "Freire",
      "Guimarães", "Lopes", "Machado", "Marques", "Medeiros", "Miranda", "Moraes", "Moura", "Neves", "Pinto",
      "Ramos", "Reis", "Ribeiro", "Sampaio", "Siqueira", "Tavares", "Vasconcelos", "Vieira", "Xavier", "Zanetti",
      "Barros", "Bezerra", "Borges", "Braga", "Brito", "Caldeira", "Camargo", "Cunha", "Diniz", "Esteves",
      "Faria", "Figueiredo", "Garcia", "Gonçalves", "Henriques", "Jesus", "Leite", "Macedo", "Magalhães", "Maia",
      "Matos", "Mota", "Nogueira", "Paiva", "Peixoto", "Prado", "Queiroz", "Rangel", "Rezende", "Sá",
      "Soares", "Toledo", "Valente", "Viana", "Azevedo", "Bastos", "Bittencourt", "Fontes", "Amaral", "Assis",
      "Rossi", "Ferraz", "Tanaka", "Nakamura", "Schmidt", "Muller", "Bianchi", "Esposito", "Ferrari", "Moretti",
    ],
  }),
};

export function randomFirstName(gender: Gender, region: RegionKey = "us"): string {
  const pools = NAME_POOLS[region];
  const names = gender === "male" ? pools.male : gender === "female" ? pools.female : pools.neutral;
  return names[Math.floor(Math.random() * names.length)];
}

export function randomLastName(region: RegionKey = "us"): string {
  const names = NAME_POOLS[region].last;
  return names[Math.floor(Math.random() * names.length)];
}

export function randomFullName(region: RegionKey = "us", lastName?: string, gender?: Gender): string {
  const genders: Gender[] = ["male", "female", "nonbinary"];
  gender ??= genders[Math.floor(Math.random() * genders.length)];
  return `${randomFirstName(gender, region)} ${lastName ?? randomLastName(region)}`;
}
