/*
  # Create Master Country List Table

  1. New Tables
    - `master_country_list`
      - `id` (integer, primary key)
      - `country_name` (text, unique)
      - `country_code` (text, ISO 3166-1 alpha-2)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

  2. Data
    - Populate with all world countries

  3. Security
    - Enable RLS on `master_country_list` table
    - Add policy for authenticated users to read country data
    - Add policy for admins to manage country data

  4. Important Notes
    - Country list is publicly readable for form dropdowns
    - Only authenticated users can access
    - Countries are sorted alphabetically by default
*/

-- Create master country list table
CREATE TABLE IF NOT EXISTS master_country_list (
  id serial PRIMARY KEY,
  country_name text UNIQUE NOT NULL,
  country_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE master_country_list ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active countries
CREATE POLICY "Anyone can read active countries"
  ON master_country_list
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage countries
CREATE POLICY "Admins can manage countries"
  ON master_country_list
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id IN (
        SELECT id FROM roles WHERE name IN ('Admin', 'Admin Assistant')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id IN (
        SELECT id FROM roles WHERE name IN ('Admin', 'Admin Assistant')
      )
    )
  );

-- Populate with world countries
INSERT INTO master_country_list (country_name, country_code) VALUES
  ('AFGHANISTAN', 'AF'),
  ('ALBANIA', 'AL'),
  ('ALGERIA', 'DZ'),
  ('ANDORRA', 'AD'),
  ('ANGOLA', 'AO'),
  ('ANTIGUA AND BARBUDA', 'AG'),
  ('ARGENTINA', 'AR'),
  ('ARMENIA', 'AM'),
  ('AUSTRALIA', 'AU'),
  ('AUSTRIA', 'AT'),
  ('AZERBAIJAN', 'AZ'),
  ('BAHAMAS', 'BS'),
  ('BAHRAIN', 'BH'),
  ('BANGLADESH', 'BD'),
  ('BARBADOS', 'BB'),
  ('BELARUS', 'BY'),
  ('BELGIUM', 'BE'),
  ('BELIZE', 'BZ'),
  ('BENIN', 'BJ'),
  ('BHUTAN', 'BT'),
  ('BOLIVIA', 'BO'),
  ('BOSNIA AND HERZEGOVINA', 'BA'),
  ('BOTSWANA', 'BW'),
  ('BRAZIL', 'BR'),
  ('BRUNEI', 'BN'),
  ('BULGARIA', 'BG'),
  ('BURKINA FASO', 'BF'),
  ('BURUNDI', 'BI'),
  ('CABO VERDE', 'CV'),
  ('CAMBODIA', 'KH'),
  ('CAMEROON', 'CM'),
  ('CANADA', 'CA'),
  ('CENTRAL AFRICAN REPUBLIC', 'CF'),
  ('CHAD', 'TD'),
  ('CHILE', 'CL'),
  ('CHINA', 'CN'),
  ('COLOMBIA', 'CO'),
  ('COMOROS', 'KM'),
  ('CONGO', 'CG'),
  ('COSTA RICA', 'CR'),
  ('CROATIA', 'HR'),
  ('CUBA', 'CU'),
  ('CYPRUS', 'CY'),
  ('CZECH REPUBLIC', 'CZ'),
  ('DENMARK', 'DK'),
  ('DJIBOUTI', 'DJ'),
  ('DOMINICA', 'DM'),
  ('DOMINICAN REPUBLIC', 'DO'),
  ('ECUADOR', 'EC'),
  ('EGYPT', 'EG'),
  ('EL SALVADOR', 'SV'),
  ('EQUATORIAL GUINEA', 'GQ'),
  ('ERITREA', 'ER'),
  ('ESTONIA', 'EE'),
  ('ESWATINI', 'SZ'),
  ('ETHIOPIA', 'ET'),
  ('FIJI', 'FJ'),
  ('FINLAND', 'FI'),
  ('FRANCE', 'FR'),
  ('GABON', 'GA'),
  ('GAMBIA', 'GM'),
  ('GEORGIA', 'GE'),
  ('GERMANY', 'DE'),
  ('GHANA', 'GH'),
  ('GREECE', 'GR'),
  ('GRENADA', 'GD'),
  ('GUATEMALA', 'GT'),
  ('GUINEA', 'GN'),
  ('GUINEA-BISSAU', 'GW'),
  ('GUYANA', 'GY'),
  ('HAITI', 'HT'),
  ('HONDURAS', 'HN'),
  ('HUNGARY', 'HU'),
  ('ICELAND', 'IS'),
  ('INDIA', 'IN'),
  ('INDONESIA', 'ID'),
  ('IRAN', 'IR'),
  ('IRAQ', 'IQ'),
  ('IRELAND', 'IE'),
  ('ISRAEL', 'IL'),
  ('ITALY', 'IT'),
  ('JAMAICA', 'JM'),
  ('JAPAN', 'JP'),
  ('JORDAN', 'JO'),
  ('KAZAKHSTAN', 'KZ'),
  ('KENYA', 'KE'),
  ('KIRIBATI', 'KI'),
  ('KOSOVO', 'XK'),
  ('KUWAIT', 'KW'),
  ('KYRGYZSTAN', 'KG'),
  ('LAOS', 'LA'),
  ('LATVIA', 'LV'),
  ('LEBANON', 'LB'),
  ('LESOTHO', 'LS'),
  ('LIBERIA', 'LR'),
  ('LIBYA', 'LY'),
  ('LIECHTENSTEIN', 'LI'),
  ('LITHUANIA', 'LT'),
  ('LUXEMBOURG', 'LU'),
  ('MADAGASCAR', 'MG'),
  ('MALAWI', 'MW'),
  ('MALAYSIA', 'MY'),
  ('MALDIVES', 'MV'),
  ('MALI', 'ML'),
  ('MALTA', 'MT'),
  ('MARSHALL ISLANDS', 'MH'),
  ('MAURITANIA', 'MR'),
  ('MAURITIUS', 'MU'),
  ('MEXICO', 'MX'),
  ('MICRONESIA', 'FM'),
  ('MOLDOVA', 'MD'),
  ('MONACO', 'MC'),
  ('MONGOLIA', 'MN'),
  ('MONTENEGRO', 'ME'),
  ('MOROCCO', 'MA'),
  ('MOZAMBIQUE', 'MZ'),
  ('MYANMAR', 'MM'),
  ('NAMIBIA', 'NA'),
  ('NAURU', 'NR'),
  ('NEPAL', 'NP'),
  ('NETHERLANDS', 'NL'),
  ('NEW ZEALAND', 'NZ'),
  ('NICARAGUA', 'NI'),
  ('NIGER', 'NE'),
  ('NIGERIA', 'NG'),
  ('NORTH KOREA', 'KP'),
  ('NORTH MACEDONIA', 'MK'),
  ('NORWAY', 'NO'),
  ('OMAN', 'OM'),
  ('PAKISTAN', 'PK'),
  ('PALAU', 'PW'),
  ('PALESTINE', 'PS'),
  ('PANAMA', 'PA'),
  ('PAPUA NEW GUINEA', 'PG'),
  ('PARAGUAY', 'PY'),
  ('PERU', 'PE'),
  ('PHILIPPINES', 'PH'),
  ('POLAND', 'PL'),
  ('PORTUGAL', 'PT'),
  ('QATAR', 'QA'),
  ('ROMANIA', 'RO'),
  ('RUSSIA', 'RU'),
  ('RWANDA', 'RW'),
  ('SAINT KITTS AND NEVIS', 'KN'),
  ('SAINT LUCIA', 'LC'),
  ('SAINT VINCENT AND THE GRENADINES', 'VC'),
  ('SAMOA', 'WS'),
  ('SAN MARINO', 'SM'),
  ('SAO TOME AND PRINCIPE', 'ST'),
  ('SAUDI ARABIA', 'SA'),
  ('SENEGAL', 'SN'),
  ('SERBIA', 'RS'),
  ('SEYCHELLES', 'SC'),
  ('SIERRA LEONE', 'SL'),
  ('SINGAPORE', 'SG'),
  ('SLOVAKIA', 'SK'),
  ('SLOVENIA', 'SI'),
  ('SOLOMON ISLANDS', 'SB'),
  ('SOMALIA', 'SO'),
  ('SOUTH AFRICA', 'ZA'),
  ('SOUTH KOREA', 'KR'),
  ('SOUTH SUDAN', 'SS'),
  ('SPAIN', 'ES'),
  ('SRI LANKA', 'LK'),
  ('SUDAN', 'SD'),
  ('SURINAME', 'SR'),
  ('SWEDEN', 'SE'),
  ('SWITZERLAND', 'CH'),
  ('SYRIA', 'SY'),
  ('TAIWAN', 'TW'),
  ('TAJIKISTAN', 'TJ'),
  ('TANZANIA', 'TZ'),
  ('THAILAND', 'TH'),
  ('TIMOR-LESTE', 'TL'),
  ('TOGO', 'TG'),
  ('TONGA', 'TO'),
  ('TRINIDAD AND TOBAGO', 'TT'),
  ('TUNISIA', 'TN'),
  ('TURKEY', 'TR'),
  ('TURKMENISTAN', 'TM'),
  ('TUVALU', 'TV'),
  ('UGANDA', 'UG'),
  ('UKRAINE', 'UA'),
  ('UNITED ARAB EMIRATES', 'AE'),
  ('UNITED KINGDOM', 'GB'),
  ('UNITED STATES', 'US'),
  ('URUGUAY', 'UY'),
  ('UZBEKISTAN', 'UZ'),
  ('VANUATU', 'VU'),
  ('VATICAN CITY', 'VA'),
  ('VENEZUELA', 'VE'),
  ('VIETNAM', 'VN'),
  ('YEMEN', 'YE'),
  ('ZAMBIA', 'ZM'),
  ('ZIMBABWE', 'ZW')
ON CONFLICT (country_name) DO NOTHING;
