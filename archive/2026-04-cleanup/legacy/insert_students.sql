-- ==========================================
-- COMPLETE SYSTEM-SIDE STUDENT DATA SYNC
-- ==========================================
-- This script handles EVERYTHING: Table creation, Data Population, and Profile Syncing.

-- 1. Setup the Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    branch TEXT NOT NULL,
    roll_no TEXT
);

-- 2. Setup the Attendance Logs Table (Crucial for submission)
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
CREATE TABLE public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch TEXT NOT NULL,
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    status INTEGER NOT NULL, -- 1 for present, 0 for absent
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(branch, subject, date, roll_no)
);

-- 3. Clear existing entries to avoid conflicts
TRUNCATE public.students CASCADE;

-- 4. Ensure profiles table has correct columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_no TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ==========================================
-- POPULATING STUDENTS
-- ==========================================

-- Branch: AI / ML
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VEDASHREE KIRAN KAYANDE', 'kayandevedashree6@gmail.com', 'AI / ML', '1');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAKSHI BALAJI PHAD', 'phadsakshi54@gmail.com', 'AI / ML', '2');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RAZA WAHAB DAREKAR', 'razadarekari25@gmail.com', 'AI / ML', '3');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PIYUSH SHANKAR MAZIRE', 'piyushmazire07@gmail.com', 'AI / ML', '4');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AMOGH PRABHAKAR RODGE', 'amoghrodge@gmail.com', 'AI / ML', '5');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('GOURISH ATUL KATKAR', 'gourishkatkar@gmail.com', 'AI / ML', '6');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRANAV DHANANJAY KADAM', 'pran182006@gmail.com', 'AI / ML', '7');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KARAN CHANDRAKANT NAYBAL', 'naybalkaran07@gmail.com', 'AI / ML', '8');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASH KAILAS GUJAR', 'ygujar631@gmail.com', 'AI / ML', '9');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAMRUDDHI KISHOR PAWAR', 'samruddhipawar0214@gmail.com', 'AI / ML', '10');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NAMRATA SANTOSH CHAVAN', 'namratachavan36524@gmail.com', 'AI / ML', '11');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ARYAN VIJAY ATKORE', 'aryanatkore@gmail.com', 'AI / ML', '12');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRANAY SUNIL PATIL', 'pranaypatil1724@gmail.com', 'AI / ML', '13');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRANAV RAJENDRA KADAM', 'pranavkd2007@gmail.com', 'AI / ML', '14');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ADITYA SANDIPAN PAWAR', 'pawaraditya1505@gmail.com', 'AI / ML', '15');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VARAD VINAYAK ATHAVALE', 'varadvinayakva2@gmail.com', 'AI / ML', '16');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ADITEE RAVINDRA TEMGHARE', 'temghareaditee@gmail.com', 'AI / ML', '17');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRANAV SHAHAJI SURYAWANSHI', 'pranavsuryawanshi9765@gmail.com', 'AI / ML', '18');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('GUNJAN SUNIL KANADE', 'gunjankanade2@gmail.com', 'AI / ML', '19');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHRIKANT SHIVLAL DHORE', 'dhorepushpa171@gmail.com', 'AI / ML', '20');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHRAVANI ANAND GADE', 'gadeshruti2020@gmail.com', 'AI / ML', '21');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAHIL ROHIT KINIKAR', 'sahilkinikar7@gmail.com', 'AI / ML', '22');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANJALI SANTOSH GADHAVE', 'mangalgadhave1985@gmail.com', 'AI / ML', '23');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('TEJASWINI UMESH KOTWAL', 'tukotwal0806@gmail.com', 'AI / ML', '24');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VARAD SANJAY CHANDRAS', 'varadchandras@gmail.com', 'AI / ML', '25');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRATHAMESH LOKESH GARODE', 'technicalpratham012@gmail.com', 'AI / ML', '26');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SARVESH MAHAVIR SANGHAI', 'sarveshsanghai.1720006@gmail.com', 'AI / ML', '27');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NANDINI GOPAL LANDGE', 'nandinilandge79@gmail.com', 'AI / ML', '28');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RITESH BASAWARAJ VALSANGE', 'riteshvalsange@gmail.com', 'AI / ML', '29');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VEDIKA RAVINDRA DAUNDKAR', 'vedikadaundkar@gmail.com', 'AI / ML', '30');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SUJAL LAXMAN GAWADE', 'sujalgawade501@gmail.com', 'AI / ML', '31');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MANASI SANJAY DHUPKAR', 'manasidhupkar@gmail.com', 'AI / ML', '32');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SRUSHTI SANDIP SURYAKAR', 'suryakarsrushti@gmail.com', 'AI / ML', '33');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NEEV LAXMAN THAKUR', 'neevthakur18@gmail.com', 'AI / ML', '34');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SANIKA SACHIN SUPEKAR', 'sanika.supekar07@gmail.com', 'AI / ML', '35');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANUSHKA VIJAY SALVE', 'anushkasalve456@gmail.com', 'AI / ML', '36');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ROSHANI SUNIL GHUGE', 'ghugeroshani3@gmail.com', 'AI / ML', '37');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('GIRIJA RAHUL KSHIRSAGAR', 'girija15022008@gmail.com', 'AI / ML', '38');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('HARIOM ASHOK GAIKWAD', 'gaikwadhariom46@gmail.com', 'AI / ML', '39');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DEVYANI NAGRAM JADHAV', 'devyani@286@gmail.com', 'AI / ML', '40');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ADITYA GIRISH THUBE', 'adityathube2299@gmail.com', 'AI / ML', '41');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('GOVIND UDAY GANDHI', 'govindugandhi@gmail.com', 'AI / ML', '42');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PREM MOHAN SINHE', 'sinheprem1@gmail.com', 'AI / ML', '43');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANJALI MUKUND SHINDE', 'anjalishinde2007@gmail.com', 'AI / ML', '44');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RIDDHI SHAILESH PIMPALE', 'riddhipimpale227@gmail.com', 'AI / ML', '45');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DNYANRATNA CHANDRESHKHAR MATHPATI', 'dnyanratnamathpati@gmail.com', 'AI / ML', '46');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VINEET NITIN SAKAT', 'sakatvinit9823@gmail.com', 'AI / ML', '47');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANIKET RAJENDRA PANDHARKAR', 'aniketpandharkar953@gmail.com', 'AI / ML', '48');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DATTATRAY LAXMAN MOHALKAR', 'aadityamohalkar@gmail.com', 'AI / ML', '49');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ABHAY ANKUSH WALKE', 'abhaywalke96@gmail.com', 'AI / ML', '50');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHRIKANT MAHADEV JADHAV', 'shrikantjadhav0702@gmail.com', 'AI / ML', '51');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAMARTH MAHESH TAKAWALE', 'samarthtakawale0@gmail.com', 'AI / ML', '52');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ONKAR RAVSO KADAM', 'onkarikadam820@gmail.com', 'AI / ML', '53');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('JAINAB NAZIM KAZI', 'jainabkazi575@gmail.com', 'AI / ML', '54');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AYUSH RAVINDRA NIMBHARE', 'nimbhareayush123@gmail.com', 'AI / ML', '55');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NIRANJAN NANDU TAKALKAR', 'niranjantakalkar@gmail.com', 'AI / ML', '56');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NANDINI KRISHNA GURRAM', 'nandinigurram211@gmail.com', 'AI / ML', '57');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PARIS RAJENDRA CHAUDHARI', 'parischaudhari130@gmail.com', 'AI / ML', '58');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAFEENA SAHABJAN ANSARI', 'safinaansari710@gmail.com', 'AI / ML', '59');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RAHUL KISAN BHENDARWAL', 'rajputrahu18730@gmail.com', 'AI / ML', '60');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('JAYANT RAKESH MANI MISHRA', 'jayantmishra808@gmail.com', 'AI / ML', '61');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('BHARGAV BAPU CHAVAN', 'bhargavchavan325@gmail.com', 'AI / ML', '62');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VIDHI RAJKUMAR ATTAL', 'attalvidhi@gmail.com', 'AI / ML', '63');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PALAK VINOD KATHAR', 'palakkathar@gmail.com', 'AI / ML', '64');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('TANISHQA SUNIL MODHAVE', 'tanishqa150307@gmail.com', 'AI / ML', '65');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NIKHIL SHRIKISHAN KALIYA', 'nikhilkaliya17@gmail.com', 'AI / ML', '66');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('GAURI SHASHIKANT VYAVAHARE', 'gaurivyavahare18@gmail.com', 'AI / ML', '67');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AARYA ABHIJEET GIRME', 'aaryagirme42@gmail.com', 'AI / ML', '68');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RUCHIRA RAMESH YEMUL', 'ruchi252007@gmail.com', 'AI / ML', '69');
-- Branch: Computer Engineering
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ARYA KIRAN DHAVANE', 'aryadhavane@gmail.com', 'Computer Engineering', '1');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ISHAN PRANAY DALVI', 'ishandalvi834@gmail.com', 'Computer Engineering', '2');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KALYANI RAMESHWAR DOKHE', 'kalyanidokhe11.1@gmail.com', 'Computer Engineering', '3');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANUPRAS SACHIN ZINJADE', 'zinjadeanupras@gmail.com', 'Computer Engineering', '4');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAYALI VIJAY GHAYTADAKAR', 'sayalighaytadkar@gmail.com', 'Computer Engineering', '5');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ADITYA SAINATH WARKAR', 'adityawarkar18@gmail.com', 'Computer Engineering', '6');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('UTKARSHA CHANDRKANT NIPRUL', 'utkarshaniprul@gmail.com', 'Computer Engineering', '7');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('CHIRAYU SACHIN LUNAWAT', 'chirayulunawat7@gmail.com', 'Computer Engineering', '8');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHREYA ARUN SHINDE', 'shreyashinde8815@gmail.com', 'Computer Engineering', '9');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SANDHYA TANAJI BHOSALE', 'bhosalesandhya2623@gmail.com', 'Computer Engineering', '10');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRACHI DATTATRAY PANCHPOR', 'prachipanchpor03@gmail.com', 'Computer Engineering', '11');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANWESHA JAILESH GAIKWAD', 'anweshagaikwad6@gmail.com', 'Computer Engineering', '12');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('REHAN KAMRUDDIN SHAIKH', 'rehanshaikh111906@gmail.com', 'Computer Engineering', '13');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHUBHAM BAPUSAHEB MORE', 'shubhambmore23@gmail.com', 'Computer Engineering', '14');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SANCHIT SANTOSH SATALE', 'sanchitsatale07@gmail.com', 'Computer Engineering', '15');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('HARSHAL SHANKAR KARCHKHED', 'harshalkarchkhed2007@gmail.com', 'Computer Engineering', '16');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SWAPNIL ASHOK SALVE', 'swapnilsalve821@gmail.com', 'Computer Engineering', '17');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SRUSHTI SUNIL SHINDE', 'srushtisrushti147@gmail.com', 'Computer Engineering', '18');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SRUSHTI SHASHIKANT KATKAR', 'srushtikatkar552@gmail.com', 'Computer Engineering', '19');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('GARGI SACHIN MARKALE', 'gargi0422@gmail.com', 'Computer Engineering', '20');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRATIK NAMDEV MORE', 'pm17.more@gmail.com', 'Computer Engineering', '21');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('BHOOMI SACHIN HEDA', 'bhoomiheda94@gmail.com', 'Computer Engineering', '22');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASHRAJ BHAUSAHEB JANJIRE', 'yashrajj7575@gmail.com', 'Computer Engineering', '23');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VAISHNAVI VIVEKANAND SWAMI', 'swamivaishnavi2007@gmail.com', 'Computer Engineering', '24');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PIYUSH SANJAY KUMAT', 'piyushkumat0718@gmail.com', 'Computer Engineering', '25');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ABHISHEK EKNATH GHULE', 'abhiguhe1610@gmail.com', 'Computer Engineering', '26');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('GORE PUSHPAHAS PRAKASH', 'pushpahasgore@gmail.com', 'Computer Engineering', '27');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('JAY LALIT BHOLE', 'jaylalithbole@gmail.com', 'Computer Engineering', '28');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ATHARV RAJARAM CHOUGULE', 'atharvchougule212007@gmail.com', 'Computer Engineering', '29');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRATHAMESH SANJAY BHUJBAL', 'prathameshbhujbal2007@gmail.com', 'Computer Engineering', '30');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NIKITA RAMESH MHASKE', 'mhaskenikita484@gmail.com', 'Computer Engineering', '31');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SNEHA RAVINDRA PATIL', 'sneharp1707@gmail.com', 'Computer Engineering', '32');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PUJARI SARTHAK SUNIL', 'pujarisarthako3@gmail.com', 'Computer Engineering', '33');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAYALI PRAVIN PAYGUDE', 'sayalipaygude2007@gmail.com', 'Computer Engineering', '34');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRATHAMESH KASHINATH KASAR', 'kasarpratham08@gmail.com', 'Computer Engineering', '35');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('HARSH RAMRAO BIRADAR', 'biradarharsh48@gmail.com', 'Computer Engineering', '36');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RAJDEEP RAHUL BHOSALE', 'rajdeepb2007@gmail.com', 'Computer Engineering', '37');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RISHIKA RAJU YADAV', 'rishikayadav0103@gmail.com', 'Computer Engineering', '38');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KRISHNA CHANDRAKANT MAHAJAN', 'krushnmahajan@gmail.com', 'Computer Engineering', '39');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RUTUJA PRASHANT DARE', 'rutujadare@gmail.com', 'Computer Engineering', '40');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ROHIT DIPAKSINGH THAKUR', 'rohit1757thakur@gmail.com', 'Computer Engineering', '41');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ATHARVA MANOJ DHILE', 'atharva123dhile@gmail.com', 'Computer Engineering', '42');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAHIL BALU JOGALE', 'jogalesahil88@gmail.com', 'Computer Engineering', '43');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NAVYA HEMANT HADOLE', 'navyahadole@gmail.com', 'Computer Engineering', '44');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DNYANDA SHAILESH BABAR', 'dnyandababar09@gmail.com', 'Computer Engineering', '45');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NISHA GOTU DHANGAR', 'nishadhangar715@gmail.com', 'Computer Engineering', '46');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RUCHA PRASAD PARANJAPE', 'ruchamp12@gmail.com', 'Computer Engineering', '47');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAMARTH TRIMBAK BHUTEKAR', 'samarthbhutekar17@gmail.com', 'Computer Engineering', '48');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MADHURA MUKESH KSHIRSAGAR', 'madhuksagar28@gmail.com', 'Computer Engineering', '49');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANIKET KAILAS KOLSEPATIL', 'aniketkolse07@gmail.com', 'Computer Engineering', '50');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AAYUSH GANESH KANDHARE', 'aayushkandhare07@gmail.com', 'Computer Engineering', '51');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NIKHIL SUDHAKAR SHINDE', 'nikhilshinde5471@gmail.com', 'Computer Engineering', '52');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('TANISHKA ROHIDAS GUPTE', 'tanishkagupte06@gmail.com', 'Computer Engineering', '53');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASH SANDIP PAWAR', 'yash1001p@gmail.com', 'Computer Engineering', '54');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SANIKA SAMBHAJI WATKAR', 'watkarsanika43@gmail.com', 'Computer Engineering', '55');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MIT SHRIKANT KARWA', 'mitkarwa21@gmail.com', 'Computer Engineering', '56');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANUSHKA GANESH RAUT', 'katodomoon69@gmail.com', 'Computer Engineering', '57');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SARTHAK HARIBHAU PAUL', 'sarthakpaul397@gmail.com', 'Computer Engineering', '58');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RUCHA SACHIN BHALERAO', '', 'Computer Engineering', '59');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAKSHI SHANKAR BHAGAT', 'vanitabhagat750@gmail.com', 'Computer Engineering', '60');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHUBHAM DIPAK CHUNGADE', 'shubhamrajput67413@gmail.com', 'Computer Engineering', '61');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KARUNASHREE RAMPRASAD SAIRI', 'karunasairi@gmail.com', 'Computer Engineering', '62');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MOHIT AMIT KHANDELWAL', 'mohitkhandelwal2007@gmail.com', 'Computer Engineering', '63');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('UMAKANT ARJUN CHAVAN', 'chavanumakant63@gmail.com', 'Computer Engineering', '64');
-- Branch: Electronics and Telecommunication Engineering
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANUSHKA ANAND KULKARNI', 'anushka2042@gmail.com', 'Electronics and Telecommunication Engineering', '1');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MANASVI PRAFUL GAIKWAD', 'manasvigaiwad0598@gmail.com', 'Electronics and Telecommunication Engineering', '2');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('LAXMI KANARAM CHOUDHARY', 'choudharylaxmi924@gmail.com', 'Electronics and Telecommunication Engineering', '3');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MALHAR SAMEER KHADKIKAR', 'malharkhadikar@gmail.com', 'Electronics and Telecommunication Engineering', '4');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRASHANT GAJANAN HADPAD', 'prashanthadpad233@gmail.com', 'Electronics and Telecommunication Engineering', '5');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KSHITIJ ABHIMANYU PRADHAN', 'kshitijpradhan248@gmail.com', 'Electronics and Telecommunication Engineering', '6');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ODEDARA DHRUV GOVINDBHAI', 'dhruvodedara2007@gmail.com', 'Electronics and Telecommunication Engineering', '7');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NIRANJAN ASHRUBA NINALE', 'ninaleniranjan0177@gmail.com', 'Electronics and Telecommunication Engineering', '8');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MOHIL MAHENDRA KAMBLE', 'mohilimkamble@gmail.com', 'Electronics and Telecommunication Engineering', '9');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MADAN RAMESH BHATI', 'Madanbhati2050@gmail.com', 'Electronics and Telecommunication Engineering', '10');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RITIKA NANASAHEB KELGANDRE', 'ritikakelgandre@gmail.com', 'Electronics and Telecommunication Engineering', '11');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SARTHAKI SAMEER BORKAR', 'sarthakiborkar727@gmail.com', 'Electronics and Telecommunication Engineering', '12');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHUBHRA SANTOSH KSHIRSAGAR', 'shubhrakshirsagar2@gmail.com', 'Electronics and Telecommunication Engineering', '13');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RANVEER RAJESH MARNE', 'ranveermarane@gmail.com', 'Electronics and Telecommunication Engineering', '14');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('REVATI PADMAKAR KAPSE', 'revti.sarde@gmail.com', 'Electronics and Telecommunication Engineering', '15');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHANTANU SANDEEP NAVALE', 'shantanunavale73@gmail.com', 'Electronics and Telecommunication Engineering', '16');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DNYANESHWARI UMESH KADAM', 'kadamdnyaneshwari25@gmail.com', 'Electronics and Telecommunication Engineering', '17');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RADHIKA SUHAS JOSHI', 'radhikajoshi.0807@gmail.com', 'Electronics and Telecommunication Engineering', '18');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KOMAL PRAKASH SURVE', 'survekomal6478@gmail.com', 'Electronics and Telecommunication Engineering', '19');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHRADDHA DAYANAND KARAJAGI', 'shraddhadpkaraijagi17@gmail.com', 'Electronics and Telecommunication Engineering', '20');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RUSHIKESH BALAJI BHUJBALE', 'rushikeshbbujale10@gmail.com', 'Electronics and Telecommunication Engineering', '21');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAMARTH JITENDRA MURGULWAR', 'samarthmurgulwar546@gmail.com', 'Electronics and Telecommunication Engineering', '22');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('OMKAR BAPU NALAWADE', 'nalawadebapu823@gmail.com', 'Electronics and Telecommunication Engineering', '23');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KAUSTUBH BHARAT DISALE', 'kaustubhdisale21@gmail.com', 'Electronics and Telecommunication Engineering', '24');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AARYAN ASHOK SALUNKE', 'aaryan.salunke3907@gmail.com', 'Electronics and Telecommunication Engineering', '25');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RAHUL RAMDAS SHINDE', 'rahulshinde4807@gmail.com', 'Electronics and Telecommunication Engineering', '26');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SOHAM RAJKUMAR GORE', 'sohamgore2007@gmail.com', 'Electronics and Telecommunication Engineering', '27');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASH NITIN CHANDELKAR', 'yashchandelkar1@gmail.com', 'Electronics and Telecommunication Engineering', '28');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AARYA SACHIN KALE', 'kalearya9763@gmail.com', 'Electronics and Telecommunication Engineering', '29');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SANGITA GANPAT CHALAKE', 'sangitachalake420@gmail.com', 'Electronics and Telecommunication Engineering', '30');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SOHAM RAJENDRA VAJE', 'vajesoham1@gmail.com', 'Electronics and Telecommunication Engineering', '31');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRASAD SACHIN CHAVAN', 'prasadchavan1448@gmail.com', 'Electronics and Telecommunication Engineering', '32');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('UTKARSHA BALASAHEB GAWADE', 'gawadeuttu43@gmail.com', 'Electronics and Telecommunication Engineering', '33');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASH SANTOSH NALAWADE', 'yashnalawade0007@gmail.com', 'Electronics and Telecommunication Engineering', '34');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NEEL RAVINDRA AHERRAO', 'neelaherrao@gmail.com', 'Electronics and Telecommunication Engineering', '35');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MANOLKAR ROSHAN ABHAY', 'roshanmanolkar7@gmail.com', 'Electronics and Telecommunication Engineering', '36');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('JANAVI UTTAM CHIKANE', 'janavichikane2007@gmail.com', 'Electronics and Telecommunication Engineering', '37');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHREYAS RAJARAM BHAVAR', 'shreyasbhavar2007@gmail.com', 'Electronics and Telecommunication Engineering', '38');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('TANISHQUA NILESH YEOLE', 'tanishquayeole1@gmail.com', 'Electronics and Telecommunication Engineering', '39');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DHRUV PANKAJ PAWAR', 'dhruvpawar879@gmail.com', 'Electronics and Telecommunication Engineering', '40');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VEDANT DEVDAS INGALE', 'vedantingale247@gmail.com', 'Electronics and Telecommunication Engineering', '41');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAKSHI RAMCHANDRA SHINDE', 'sakshi21032007@gmail.com', 'Electronics and Telecommunication Engineering', '42');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PIYUSH KAILAS GAWAI', 'gawaipiyush44@gmail.com', 'Electronics and Telecommunication Engineering', '43');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ADITYA ANANDA KARANDE', 'adityakarande215@gmail.com', 'Electronics and Telecommunication Engineering', '44');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PIYUSH ANAND SONAR', 'piyushsonar1821@gmail.com', 'Electronics and Telecommunication Engineering', '45');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ABHIMAN PRADEEP SHINDE', 'abhimanshinde506@gmail.com', 'Electronics and Telecommunication Engineering', '46');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DHRUVA MANOJ NAIR', 'dnair087@gmail.com', 'Electronics and Telecommunication Engineering', '47');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NIKHIL LALASO NAGAVE', 'nagavenikhil@gmail.com', 'Electronics and Telecommunication Engineering', '48');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KARTIK RAJESH KATKAR', 'kartikkatkar4@gmail.com', 'Electronics and Telecommunication Engineering', '49');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHREYA SACHINSINGH THAKUR', 'thakurshreyaprd@gmail.com', 'Electronics and Telecommunication Engineering', '50');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAYALI DILIP CHOUDHARI', 'sayalichoudhari83@gmail.com', 'Electronics and Telecommunication Engineering', '51');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KUNAL SUNIL MANDALE', 'kunalmandale007@gmail.com', 'Electronics and Telecommunication Engineering', '52');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VEDIKA VAMAN BIDVE', 'bidvevedika@gmail.com', 'Electronics and Telecommunication Engineering', '53');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VAISHNAVI SOMINATH SULTANE', 'vaishnavisultane68@gmail.com', 'Electronics and Telecommunication Engineering', '54');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VISHWAJEET SANJAY PAWAR', 'pawarvishwajeet3883@gmail.com', 'Electronics and Telecommunication Engineering', '55');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KSHITIJA VINOD RAJURKAR', 'rajurkarkshitija587@gmail.com', 'Electronics and Telecommunication Engineering', '56');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DHAWAL VINAYAK RAUT', 'dhawal.v.raut@gmail.com', 'Electronics and Telecommunication Engineering', '57');
-- Branch: Information Technology
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHREYAS PRAVIN HARAL', 'spkulkarni2009@gmail.com', 'Information Technology', '1');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASHRAJ ARJUN RANDHAVE', 'yashrajrandhave82@gmail.com', 'Information Technology', '2');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MAMTA YADAV PANDILWAD', 'pandilwadmamta23@gmail.com', 'Information Technology', '3');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRAJWAL BASAVRAJ BIRADAR', 'prajwalbiradar1114@gmail.com', 'Information Technology', '4');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRUTHA MANGESH PATIL', 'pruthampatil@gmail.com', 'Information Technology', '5');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASHRAJ MEGHASHYAM DESHMUKH', 'yashrajd13307@gmail.com', 'Information Technology', '6');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PIYUSH ANIL VAJE', 'piyushvaje.88@gmail.com', 'Information Technology', '7');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ARCHILEE RAJENDRA GIRI', 'archileegiri1605@gmail.com', 'Information Technology', '8');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAKSHI VISHWANATH JAWALKAR', 'sakshijawalkar765@gmail.com', 'Information Technology', '9');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHREYASH VIJAY KHOPADE', 'shreyashkhopade05@gmail.com', 'Information Technology', '10');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('OM KISHOR MASKE', 'omaske014@gmail.com', 'Information Technology', '11');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AKSHAINEE VIKRANT MANE', 'akshainee2008@gmail.com', 'Information Technology', '12');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SARVESH PRAVIN KOLHE', 'sarveshkolhe14@gmail.com', 'Information Technology', '13');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANKITA ANANTA GHAG', 'ankitaghag994@gmail.com', 'Information Technology', '14');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('AVANI VINAYAK CHILKA', 'chilkavani@gmail.com', 'Information Technology', '15');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHRUTIKA SHRIKANT PISARWEKAR', 'shrutikapisarwekar@gmail.com', 'Information Technology', '16');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRANJAL SANJAYKUMAR SURYAWANSHI', 'pranjalsuryawanshi1324@gmail.com', 'Information Technology', '17');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAMIKSHA PAVAN MALOO', 'maloasamiksha24@gmail.com', 'Information Technology', '18');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MANAS BHAGWAN TONDE', 'manastonde2007@gmail.com', 'Information Technology', '19');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHREYA MANOJ PHARATE', 'shreyapharate44@gmail.com', 'Information Technology', '20');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('TANAYA SHRIKANT RATHI', 'tanayarathi06@gmail.com', 'Information Technology', '21');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANMOL VINAY KAMBLE', 'anmolv.kamble07@gmail.com', 'Information Technology', '22');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ARYAN MANGESH PIMPALKAR', 'aryanpimpalkar006@gmail.com', 'Information Technology', '23');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('INDRAYANI ANIL PATALYANTRI', 'patalyantrindrayani@gmail.com', 'Information Technology', '24');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NEHA DHANAJI KALSE', 'nehakalse88@gmail.com', 'Information Technology', '25');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ADITYA SHRIMANT KHADE', 'adityakhade542@gmail.com', 'Information Technology', '26');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SAMRUDDHI SANJAY SAWANT', 'samruddhisawant024@gmail.com', 'Information Technology', '27');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ROHINI SANJAY JADHAV', 'jadhavsg621@gmail.com', 'Information Technology', '28');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRASOON SANDIP LAD', 'prasoonlad36@gmail.com', 'Information Technology', '29');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('HIMAKSHI GORAKHNATH SHINDE', 'himakshigorakhnathshinde@gmail.com', 'Information Technology', '30');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHRUTESH MARUTI RAJOLE', 'sumitrajole125@gmail.com', 'Information Technology', '31');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANAY UMESH KULKARNI', 'anaykulikarni673@gmail.com', 'Information Technology', '32');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ATHARV KALYAN MORE', 'atharvmore991@gmail.com', 'Information Technology', '33');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('MAYURESH VINAYAK BHANDARE', 'mayureshbhandare1387@gmail.com', 'Information Technology', '34');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('NITESH SHAM PAWAR', 'pawarnilesh882@gmail.com', 'Information Technology', '35');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASH DEVIDAS CHAVAN', 'yc324382@gmail.com', 'Information Technology', '36');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('DHIRAJ MANGESH DEVARE', 'dhirajdevare4546@gmail.com', 'Information Technology', '37');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRITI RAJARAM PAWASE', 'pritipawase025@gmail.com', 'Information Technology', '38');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RAKSHATA NAGARAJ KALSHETTY', 'kalshettyrakshita25@gmail.com', 'Information Technology', '39');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ADITYA SACHIN VARPE', 'aditya.s.varpe@gmail.com', 'Information Technology', '40');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SRUSHTI DILIP PATIL', 'srushitipati233@gmail.com', 'Information Technology', '41');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('TANAY RUPESH JADHAV', 'jadhavtanay927@gmail.com', 'Information Technology', '42');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('HARSH VIPUL TANK', 'tanhk631@gmail.com', 'Information Technology', '43');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('HARSHAD SANDIP NAGAVE', 'harshadnagave96@gmail.com', 'Information Technology', '44');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ANANNYA ANIRUDHA PATIL', 'patilananya353@gmail.com', 'Information Technology', '45');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('VARUNI VISHAL HUDDAR', 'Varunihuddar@gmail.com', 'Information Technology', '46');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YUVRAJ KAILAS KANADE', 'kanadeyuvraj40@gmail.com', 'Information Technology', '47');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('OMKAR KISHOR RAWAL', 'omkarnikam794@gmail.com', 'Information Technology', '48');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('PRASHANT BHARAT BITAKE', 'prashantbitake12@gmail.com', 'Information Technology', '49');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('HARSHA SANJEEV GHARU', 'harshagharu108@gmail.com', 'Information Technology', '50');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SRUSHTI MAHESH BAVDHANKAR', 'bavdhankarsrushti@gmail.com', 'Information Technology', '51');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('RANDIVE MANSI SANDIP', 'mansirandive16@gmail.com', 'Information Technology', '52');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SARAH IRSHAD KHAN', 'simplysarah077@gmail.com', 'Information Technology', '53');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('YASH SANDEEP KHEDEKAR', 'yashkhedakar787@gmail.com', 'Information Technology', '54');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('OM RAKESH HABIB', 'omkshatriya0007@gmail.com', 'Information Technology', '55');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ROHITKUMAR LALIT RATHOD', 'rohitrathod433@gmail.com', 'Information Technology', '56');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SARANG PRASHANT MANE', 'Sarangmane011@gmail.com', 'Information Technology', '57');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('KIRAN DINESH RAJPUT', 'kr3755876@gmail.com', 'Information Technology', '58');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SARWADE PARAS PARMESHWAR', 'sarwadeparas11@gmail.com', 'Information Technology', '59');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ISHWAR NARAYAN UTADE', 'rajput.ishwar0007@gmail.com', 'Information Technology', '60');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SALONI AJAY SAWANT', 'salonisawant544@gmail.com', 'Information Technology', '61');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('ROHIT AJAY RATHOD', 'rohitrathod66089@gmail.com', 'Information Technology', '62');
INSERT INTO public.students (name, email, branch, roll_no) VALUES ('SHOUNAK GANESH YENPURE', 'yenpureshounak@gmail.com', 'Information Technology', '63');

-- 4. FINAL STEP: Retro-Sync every student into their login profile right now
INSERT INTO public.profiles (id, full_name, role, branch, roll_no, email)
SELECT u.id, s.name, 'student', s.branch, s.roll_no, u.email
FROM auth.users u
JOIN public.students s ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.email))
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = 'student',
    branch = EXCLUDED.branch,
    roll_no = EXCLUDED.roll_no,
    email = EXCLUDED.email;

-- SUCCESS MESSAGE
SELECT 'STUDENT DATA SYNC COMPLETE! PLEASE REFRESH YOUR APP.' as status;

