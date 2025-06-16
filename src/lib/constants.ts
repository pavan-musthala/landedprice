/* Origin Countries (Common) */
export const originCountries = ["Malaysia", "China", "USA", "Germany", "UAE"] as const;
export type OriginCountry = typeof originCountries[number];

/* Sea Ports */
export type SeaPorts = {
  [K in OriginCountry]: string[];
};

export const seaOriginPorts: SeaPorts = {
  Malaysia: ["Port Klang", "Tanjung Pelepas", "penang port", "johor port"],
  China: ["Shanghai", "shenzhen", "ningbo-zhoushan", "guangzhou", "quingdao", "tianjin", "xiamen", "dalian"],
  USA: ["Los angeles", "long beach", "new york/new jersey", "savannah", "houston", "seattle/tacoma", "oakland", "charleston"],
  Germany: ["hamburg", "bremerhaven", "wilhelmshaven", "rostock"],
  UAE: ["jebel ali (dubai)", "khalifa port (abu dhabi)", "sharjah port"]
};

export const seaDestinationPorts = ["Chennai", "Nhava Sheva", "Mundra"] as const;

/* Air Airports */
export type AirAirports = {
  [K in OriginCountry]: string[];
};

export const airOriginAirports: AirAirports = {
  Malaysia: [
    "Kuala Lumpur International Airport", "Kota Kinabalu International Airport", "Penang International Airport",
    "Kuching International Airport", "Senai International Airport", "Langkawi International Airport",
    "Miri Airport", "Tawau Airport", "Sultan Ismail Petra Airport", "Sibu Airport"
  ],
  China: [
    "Shanghai Pudong International Airport", "Guangzhou Baiyun International Airport", "Beijing Capital International Airport",
    "Shenzhen Bao'an International Airport", "Chengdu Tianfu International Airport", "Beijing Daxing International Airport",
    "Chongqing Jiangbei International Airport", "Hangzhou Xiaoshan International Airport", "Shanghai Hongqiao International Airport",
    "Xi'an Xianyang International Airport"
  ],
  USA: [
    "Hartsfield–Jackson Atlanta International Airport", "Dallas/Fort Worth International Airport", "Denver International Airport",
    "Chicago O'Hare International Airport", "Los Angeles International Airport", "Charlotte Douglas International Airport",
    "Las Vegas Harry Reid International Airport", "Phoenix Sky Harbor International Airport",
    "Seattle–Tacoma International Airport", "Miami International Airport"
  ],
  Germany: [
    "Frankfurt Airport", "Munich Airport", "Berlin Brandenburg Airport", "Düsseldorf Airport", "Hamburg Airport",
    "Cologne Bonn Airport", "Stuttgart Airport", "Hanover Airport", "Nuremberg Airport", "Dortmund Airport"
  ],
  UAE: [
    "Dubai International Airport", "Abu Dhabi International Airport", "Sharjah International Airport",
    "Al Maktoum International Airport", "Ras Al Khaimah International Airport", "Al Ain International Airport",
    "Fujairah International Airport", "Zayed International Airport", "Delma Airport", "Sir Bani Yas Airport"
  ]
};

export const airDestinationAirports = [
  "Indira Gandhi International Airport", "Chhatrapati Shivaji Maharaj International Airport", "Kempegowda International Airport",
  "Rajiv Gandhi International Airport", "Netaji Subhas Chandra Bose International Airport", "Cochin International Airport",
  "Trivandrum International Airport", "Calicut International Airport", "Kannur International Airport",
  "Sardar Vallabhbhai Patel International Airport", "Jaipur International Airport", "Chaudhary Charan Singh International Airport",
  "Lal Bahadur Shastri International Airport", "Sri Guru Ram Dass Jee International Airport", "Lokpriya Gopinath Bordoloi International Airport",
  "Biju Patnaik International Airport", "Dr. Babasaheb Ambedkar International Airport", "Pune International Airport",
  "Devi Ahilya Bai Holkar International Airport", "Raja Bhoj International Airport", "Tiruchirappalli International Airport",
  "Madurai International Airport", "Coimbatore International Airport", "Visakhapatnam International Airport",
  "Vijayawada International Airport", "Tirupati International Airport", "Gaya International Airport", "Bagdogra International Airport",
  "Mangaluru International Airport", "Port Blair (Veer Savarkar International Airport)", "Chandigarh International Airport",
  "Birsa Munda Airport", "Imphal (Bir Tikendrajit International Airport)", "Surat International Airport",
  "Manohar International Airport (Mopa, Goa)", "Nashik Airport", "Rajkot International Airport", "Kushinagar International Airport",
  "Maharishi Valmiki International Airport (Ayodhya)", "Noida International Airport (Jewar)",
  "Sheikh ul-Alam International Airport", "Jammu Airport", "Maharaja Agrasen International Airport (Hisar)"
];

/* HSN Code List */
export const hsnCodes = [
  8471, 8473, 8517, 8528, 8504, 8544, 8518, 8443, 8523, 8708, 8409, 7318,
  6104, 6204, 6109, 6110, 4202, 9503, 9504, 8481, 8413, 8414, 3926, 3920,
  8536, 3304, 3305, 3307, 1806, 2208
]; 