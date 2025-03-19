export type DDragonChampionsData = {
  type: string;
  format: string;
  version: string;
  data: Champions;
};

export type Champions = {
  Aatrox: Aatrox;
  Ahri: Ahri;
  Akali: Akali;
  Akshan: Akshan;
  Alistar: Alistar;
  Ambessa: Ambessa;
  Amumu: Amumu;
  Anivia: Anivia;
  Annie: Annie;
  Aphelios: Aphelios;
  Ashe: Ashe;
  AurelionSol: AurelionSol;
  Aurora: Aurora;
  Azir: Azir;
  Bard: Bard;
  Belveth: Belveth;
  Blitzcrank: Blitzcrank;
  Brand: Brand;
  Braum: Braum;
  Briar: Briar;
  Caitlyn: Caitlyn;
  Camille: Camille;
  Cassiopeia: Cassiopeia;
  Chogath: Chogath;
  Corki: Corki;
  Darius: Darius;
  Diana: Diana;
  Draven: Draven;
  DrMundo: DrMundo;
  Ekko: Ekko;
  Elise: Elise;
  Evelynn: Evelynn;
  Ezreal: Ezreal;
  Fiddlesticks: Fiddlesticks;
  Fiora: Fiora;
  Fizz: Fizz;
  Galio: Galio;
  Gangplank: Gangplank;
  Garen: Garen;
  Gnar: Gnar;
  Gragas: Gragas;
  Graves: Graves;
  Gwen: Gwen;
  Hecarim: Hecarim;
  Heimerdinger: Heimerdinger;
  Hwei: Hwei;
  Illaoi: Illaoi;
  Irelia: Irelia;
  Ivern: Ivern;
  Janna: Janna;
  JarvanIV: JarvanIv;
  Jax: Jax;
  Jayce: Jayce;
  Jhin: Jhin;
  Jinx: Jinx;
  Kaisa: Kaisa;
  Kalista: Kalista;
  Karma: Karma;
  Karthus: Karthus;
  Kassadin: Kassadin;
  Katarina: Katarina;
  Kayle: Kayle;
  Kayn: Kayn;
  Kennen: Kennen;
  Khazix: Khazix;
  Kindred: Kindred;
  Kled: Kled;
  KogMaw: KogMaw;
  KSante: Ksante;
  Leblanc: Leblanc;
  LeeSin: LeeSin;
  Leona: Leona;
  Lillia: Lillia;
  Lissandra: Lissandra;
  Lucian: Lucian;
  Lulu: Lulu;
  Lux: Lux;
  Malphite: Malphite;
  Malzahar: Malzahar;
  Maokai: Maokai;
  MasterYi: MasterYi;
  Mel: Mel;
  Milio: Milio;
  MissFortune: MissFortune;
  MonkeyKing: MonkeyKing;
  Mordekaiser: Mordekaiser;
  Morgana: Morgana;
  Naafiri: Naafiri;
  Nami: Nami;
  Nasus: Nasus;
  Nautilus: Nautilus;
  Neeko: Neeko;
  Nidalee: Nidalee;
  Nilah: Nilah;
  Nocturne: Nocturne;
  Nunu: Nunu;
  Olaf: Olaf;
  Orianna: Orianna;
  Ornn: Ornn;
  Pantheon: Pantheon;
  Poppy: Poppy;
  Pyke: Pyke;
  Qiyana: Qiyana;
  Quinn: Quinn;
  Rakan: Rakan;
  Rammus: Rammus;
  RekSai: RekSai;
  Rell: Rell;
  Renata: Renata;
  Renekton: Renekton;
  Rengar: Rengar;
  Riven: Riven;
  Rumble: Rumble;
  Ryze: Ryze;
  Samira: Samira;
  Sejuani: Sejuani;
  Senna: Senna;
  Seraphine: Seraphine;
  Sett: Sett;
  Shaco: Shaco;
  Shen: Shen;
  Shyvana: Shyvana;
  Singed: Singed;
  Sion: Sion;
  Sivir: Sivir;
  Skarner: Skarner;
  Smolder: Smolder;
  Sona: Sona;
  Soraka: Soraka;
  Swain: Swain;
  Sylas: Sylas;
  Syndra: Syndra;
  TahmKench: TahmKench;
  Taliyah: Taliyah;
  Talon: Talon;
  Taric: Taric;
  Teemo: Teemo;
  Thresh: Thresh;
  Tristana: Tristana;
  Trundle: Trundle;
  Tryndamere: Tryndamere;
  TwistedFate: TwistedFate;
  Twitch: Twitch;
  Udyr: Udyr;
  Urgot: Urgot;
  Varus: Varus;
  Vayne: Vayne;
  Veigar: Veigar;
  Velkoz: Velkoz;
  Vex: Vex;
  Vi: Vi;
  Viego: Viego;
  Viktor: Viktor;
  Vladimir: Vladimir;
  Volibear: Volibear;
  Warwick: Warwick;
  Xayah: Xayah;
  Xerath: Xerath;
  XinZhao: XinZhao;
  Yasuo: Yasuo;
  Yone: Yone;
  Yorick: Yorick;
  Yuumi: Yuumi;
  Zac: Zac;
  Zed: Zed;
  Zeri: Zeri;
  Ziggs: Ziggs;
  Zilean: Zilean;
  Zoe: Zoe;
  Zyra: Zyra;
};

export type Aatrox = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info;
  image: Image;
  tags: string[];
  partype: string;
  stats: Stats;
};

export type Info = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ahri = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info2;
  image: Image2;
  tags: string[];
  partype: string;
  stats: Stats2;
};

export type Info2 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image2 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats2 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Akali = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info3;
  image: Image3;
  tags: string[];
  partype: string;
  stats: Stats3;
};

export type Info3 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image3 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats3 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Akshan = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info4;
  image: Image4;
  tags: string[];
  partype: string;
  stats: Stats4;
};

export type Info4 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image4 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats4 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Alistar = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info5;
  image: Image5;
  tags: string[];
  partype: string;
  stats: Stats5;
};

export type Info5 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image5 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats5 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ambessa = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info6;
  image: Image6;
  tags: string[];
  partype: string;
  stats: Stats6;
};

export type Info6 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image6 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats6 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Amumu = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info7;
  image: Image7;
  tags: string[];
  partype: string;
  stats: Stats7;
};

export type Info7 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image7 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats7 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Anivia = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info8;
  image: Image8;
  tags: string[];
  partype: string;
  stats: Stats8;
};

export type Info8 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image8 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats8 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Annie = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info9;
  image: Image9;
  tags: string[];
  partype: string;
  stats: Stats9;
};

export type Info9 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image9 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats9 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Aphelios = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info10;
  image: Image10;
  tags: string[];
  partype: string;
  stats: Stats10;
};

export type Info10 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image10 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats10 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ashe = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info11;
  image: Image11;
  tags: string[];
  partype: string;
  stats: Stats11;
};

export type Info11 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image11 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats11 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type AurelionSol = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info12;
  image: Image12;
  tags: string[];
  partype: string;
  stats: Stats12;
};

export type Info12 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image12 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats12 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Aurora = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info13;
  image: Image13;
  tags: string[];
  partype: string;
  stats: Stats13;
};

export type Info13 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image13 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats13 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Azir = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info14;
  image: Image14;
  tags: string[];
  partype: string;
  stats: Stats14;
};

export type Info14 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image14 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats14 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Bard = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info15;
  image: Image15;
  tags: string[];
  partype: string;
  stats: Stats15;
};

export type Info15 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image15 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats15 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Belveth = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info16;
  image: Image16;
  tags: string[];
  partype: string;
  stats: Stats16;
};

export type Info16 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image16 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats16 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Blitzcrank = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info17;
  image: Image17;
  tags: string[];
  partype: string;
  stats: Stats17;
};

export type Info17 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image17 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats17 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Brand = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info18;
  image: Image18;
  tags: string[];
  partype: string;
  stats: Stats18;
};

export type Info18 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image18 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats18 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Braum = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info19;
  image: Image19;
  tags: string[];
  partype: string;
  stats: Stats19;
};

export type Info19 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image19 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats19 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Briar = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info20;
  image: Image20;
  tags: string[];
  partype: string;
  stats: Stats20;
};

export type Info20 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image20 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats20 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Caitlyn = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info21;
  image: Image21;
  tags: string[];
  partype: string;
  stats: Stats21;
};

export type Info21 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image21 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats21 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Camille = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info22;
  image: Image22;
  tags: string[];
  partype: string;
  stats: Stats22;
};

export type Info22 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image22 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats22 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Cassiopeia = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info23;
  image: Image23;
  tags: string[];
  partype: string;
  stats: Stats23;
};

export type Info23 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image23 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats23 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Chogath = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info24;
  image: Image24;
  tags: string[];
  partype: string;
  stats: Stats24;
};

export type Info24 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image24 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats24 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Corki = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info25;
  image: Image25;
  tags: string[];
  partype: string;
  stats: Stats25;
};

export type Info25 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image25 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats25 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Darius = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info26;
  image: Image26;
  tags: string[];
  partype: string;
  stats: Stats26;
};

export type Info26 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image26 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats26 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Diana = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info27;
  image: Image27;
  tags: string[];
  partype: string;
  stats: Stats27;
};

export type Info27 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image27 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats27 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Draven = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info28;
  image: Image28;
  tags: string[];
  partype: string;
  stats: Stats28;
};

export type Info28 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image28 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats28 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type DrMundo = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info29;
  image: Image29;
  tags: string[];
  partype: string;
  stats: Stats29;
};

export type Info29 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image29 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats29 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ekko = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info30;
  image: Image30;
  tags: string[];
  partype: string;
  stats: Stats30;
};

export type Info30 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image30 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats30 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Elise = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info31;
  image: Image31;
  tags: string[];
  partype: string;
  stats: Stats31;
};

export type Info31 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image31 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats31 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Evelynn = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info32;
  image: Image32;
  tags: string[];
  partype: string;
  stats: Stats32;
};

export type Info32 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image32 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats32 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ezreal = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info33;
  image: Image33;
  tags: string[];
  partype: string;
  stats: Stats33;
};

export type Info33 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image33 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats33 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Fiddlesticks = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info34;
  image: Image34;
  tags: string[];
  partype: string;
  stats: Stats34;
};

export type Info34 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image34 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats34 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Fiora = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info35;
  image: Image35;
  tags: string[];
  partype: string;
  stats: Stats35;
};

export type Info35 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image35 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats35 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Fizz = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info36;
  image: Image36;
  tags: string[];
  partype: string;
  stats: Stats36;
};

export type Info36 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image36 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats36 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Galio = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info37;
  image: Image37;
  tags: string[];
  partype: string;
  stats: Stats37;
};

export type Info37 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image37 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats37 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Gangplank = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info38;
  image: Image38;
  tags: string[];
  partype: string;
  stats: Stats38;
};

export type Info38 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image38 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats38 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Garen = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info39;
  image: Image39;
  tags: string[];
  partype: string;
  stats: Stats39;
};

export type Info39 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image39 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats39 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Gnar = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info40;
  image: Image40;
  tags: string[];
  partype: string;
  stats: Stats40;
};

export type Info40 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image40 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats40 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Gragas = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info41;
  image: Image41;
  tags: string[];
  partype: string;
  stats: Stats41;
};

export type Info41 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image41 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats41 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Graves = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info42;
  image: Image42;
  tags: string[];
  partype: string;
  stats: Stats42;
};

export type Info42 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image42 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats42 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Gwen = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info43;
  image: Image43;
  tags: string[];
  partype: string;
  stats: Stats43;
};

export type Info43 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image43 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats43 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Hecarim = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info44;
  image: Image44;
  tags: string[];
  partype: string;
  stats: Stats44;
};

export type Info44 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image44 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats44 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Heimerdinger = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info45;
  image: Image45;
  tags: string[];
  partype: string;
  stats: Stats45;
};

export type Info45 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image45 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats45 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Hwei = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info46;
  image: Image46;
  tags: string[];
  partype: string;
  stats: Stats46;
};

export type Info46 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image46 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats46 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Illaoi = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info47;
  image: Image47;
  tags: string[];
  partype: string;
  stats: Stats47;
};

export type Info47 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image47 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats47 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Irelia = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info48;
  image: Image48;
  tags: string[];
  partype: string;
  stats: Stats48;
};

export type Info48 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image48 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats48 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ivern = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info49;
  image: Image49;
  tags: string[];
  partype: string;
  stats: Stats49;
};

export type Info49 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image49 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats49 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Janna = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info50;
  image: Image50;
  tags: string[];
  partype: string;
  stats: Stats50;
};

export type Info50 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image50 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats50 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type JarvanIv = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info51;
  image: Image51;
  tags: string[];
  partype: string;
  stats: Stats51;
};

export type Info51 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image51 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats51 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Jax = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info52;
  image: Image52;
  tags: string[];
  partype: string;
  stats: Stats52;
};

export type Info52 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image52 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats52 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Jayce = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info53;
  image: Image53;
  tags: string[];
  partype: string;
  stats: Stats53;
};

export type Info53 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image53 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats53 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Jhin = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info54;
  image: Image54;
  tags: string[];
  partype: string;
  stats: Stats54;
};

export type Info54 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image54 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats54 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Jinx = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info55;
  image: Image55;
  tags: string[];
  partype: string;
  stats: Stats55;
};

export type Info55 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image55 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats55 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kaisa = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info56;
  image: Image56;
  tags: string[];
  partype: string;
  stats: Stats56;
};

export type Info56 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image56 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats56 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kalista = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info57;
  image: Image57;
  tags: string[];
  partype: string;
  stats: Stats57;
};

export type Info57 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image57 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats57 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Karma = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info58;
  image: Image58;
  tags: string[];
  partype: string;
  stats: Stats58;
};

export type Info58 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image58 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats58 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Karthus = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info59;
  image: Image59;
  tags: string[];
  partype: string;
  stats: Stats59;
};

export type Info59 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image59 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats59 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kassadin = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info60;
  image: Image60;
  tags: string[];
  partype: string;
  stats: Stats60;
};

export type Info60 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image60 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats60 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Katarina = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info61;
  image: Image61;
  tags: string[];
  partype: string;
  stats: Stats61;
};

export type Info61 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image61 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats61 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kayle = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info62;
  image: Image62;
  tags: string[];
  partype: string;
  stats: Stats62;
};

export type Info62 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image62 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats62 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kayn = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info63;
  image: Image63;
  tags: string[];
  partype: string;
  stats: Stats63;
};

export type Info63 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image63 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats63 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kennen = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info64;
  image: Image64;
  tags: string[];
  partype: string;
  stats: Stats64;
};

export type Info64 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image64 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats64 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Khazix = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info65;
  image: Image65;
  tags: string[];
  partype: string;
  stats: Stats65;
};

export type Info65 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image65 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats65 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kindred = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info66;
  image: Image66;
  tags: string[];
  partype: string;
  stats: Stats66;
};

export type Info66 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image66 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats66 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Kled = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info67;
  image: Image67;
  tags: string[];
  partype: string;
  stats: Stats67;
};

export type Info67 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image67 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats67 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type KogMaw = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info68;
  image: Image68;
  tags: string[];
  partype: string;
  stats: Stats68;
};

export type Info68 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image68 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats68 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ksante = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info69;
  image: Image69;
  tags: string[];
  partype: string;
  stats: Stats69;
};

export type Info69 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image69 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats69 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Leblanc = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info70;
  image: Image70;
  tags: string[];
  partype: string;
  stats: Stats70;
};

export type Info70 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image70 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats70 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type LeeSin = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info71;
  image: Image71;
  tags: string[];
  partype: string;
  stats: Stats71;
};

export type Info71 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image71 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats71 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Leona = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info72;
  image: Image72;
  tags: string[];
  partype: string;
  stats: Stats72;
};

export type Info72 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image72 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats72 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Lillia = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info73;
  image: Image73;
  tags: string[];
  partype: string;
  stats: Stats73;
};

export type Info73 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image73 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats73 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Lissandra = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info74;
  image: Image74;
  tags: string[];
  partype: string;
  stats: Stats74;
};

export type Info74 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image74 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats74 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Lucian = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info75;
  image: Image75;
  tags: string[];
  partype: string;
  stats: Stats75;
};

export type Info75 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image75 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats75 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Lulu = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info76;
  image: Image76;
  tags: string[];
  partype: string;
  stats: Stats76;
};

export type Info76 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image76 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats76 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Lux = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info77;
  image: Image77;
  tags: string[];
  partype: string;
  stats: Stats77;
};

export type Info77 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image77 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats77 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Malphite = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info78;
  image: Image78;
  tags: string[];
  partype: string;
  stats: Stats78;
};

export type Info78 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image78 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats78 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Malzahar = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info79;
  image: Image79;
  tags: string[];
  partype: string;
  stats: Stats79;
};

export type Info79 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image79 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats79 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Maokai = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info80;
  image: Image80;
  tags: string[];
  partype: string;
  stats: Stats80;
};

export type Info80 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image80 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats80 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type MasterYi = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info81;
  image: Image81;
  tags: string[];
  partype: string;
  stats: Stats81;
};

export type Info81 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image81 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats81 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Mel = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info82;
  image: Image82;
  tags: string[];
  partype: string;
  stats: Stats82;
};

export type Info82 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image82 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats82 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Milio = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info83;
  image: Image83;
  tags: string[];
  partype: string;
  stats: Stats83;
};

export type Info83 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image83 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats83 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type MissFortune = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info84;
  image: Image84;
  tags: string[];
  partype: string;
  stats: Stats84;
};

export type Info84 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image84 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats84 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type MonkeyKing = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info85;
  image: Image85;
  tags: string[];
  partype: string;
  stats: Stats85;
};

export type Info85 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image85 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats85 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Mordekaiser = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info86;
  image: Image86;
  tags: string[];
  partype: string;
  stats: Stats86;
};

export type Info86 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image86 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats86 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Morgana = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info87;
  image: Image87;
  tags: string[];
  partype: string;
  stats: Stats87;
};

export type Info87 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image87 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats87 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Naafiri = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info88;
  image: Image88;
  tags: string[];
  partype: string;
  stats: Stats88;
};

export type Info88 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image88 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats88 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Nami = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info89;
  image: Image89;
  tags: string[];
  partype: string;
  stats: Stats89;
};

export type Info89 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image89 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats89 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Nasus = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info90;
  image: Image90;
  tags: string[];
  partype: string;
  stats: Stats90;
};

export type Info90 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image90 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats90 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Nautilus = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info91;
  image: Image91;
  tags: string[];
  partype: string;
  stats: Stats91;
};

export type Info91 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image91 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats91 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Neeko = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info92;
  image: Image92;
  tags: string[];
  partype: string;
  stats: Stats92;
};

export type Info92 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image92 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats92 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Nidalee = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info93;
  image: Image93;
  tags: string[];
  partype: string;
  stats: Stats93;
};

export type Info93 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image93 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats93 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Nilah = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info94;
  image: Image94;
  tags: string[];
  partype: string;
  stats: Stats94;
};

export type Info94 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image94 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats94 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Nocturne = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info95;
  image: Image95;
  tags: string[];
  partype: string;
  stats: Stats95;
};

export type Info95 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image95 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats95 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Nunu = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info96;
  image: Image96;
  tags: string[];
  partype: string;
  stats: Stats96;
};

export type Info96 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image96 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats96 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Olaf = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info97;
  image: Image97;
  tags: string[];
  partype: string;
  stats: Stats97;
};

export type Info97 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image97 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats97 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Orianna = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info98;
  image: Image98;
  tags: string[];
  partype: string;
  stats: Stats98;
};

export type Info98 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image98 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats98 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ornn = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info99;
  image: Image99;
  tags: string[];
  partype: string;
  stats: Stats99;
};

export type Info99 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image99 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats99 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Pantheon = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info100;
  image: Image100;
  tags: string[];
  partype: string;
  stats: Stats100;
};

export type Info100 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image100 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats100 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Poppy = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info101;
  image: Image101;
  tags: string[];
  partype: string;
  stats: Stats101;
};

export type Info101 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image101 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats101 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Pyke = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info102;
  image: Image102;
  tags: string[];
  partype: string;
  stats: Stats102;
};

export type Info102 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image102 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats102 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Qiyana = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info103;
  image: Image103;
  tags: string[];
  partype: string;
  stats: Stats103;
};

export type Info103 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image103 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats103 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Quinn = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info104;
  image: Image104;
  tags: string[];
  partype: string;
  stats: Stats104;
};

export type Info104 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image104 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats104 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Rakan = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info105;
  image: Image105;
  tags: string[];
  partype: string;
  stats: Stats105;
};

export type Info105 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image105 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats105 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Rammus = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info106;
  image: Image106;
  tags: string[];
  partype: string;
  stats: Stats106;
};

export type Info106 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image106 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats106 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type RekSai = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info107;
  image: Image107;
  tags: string[];
  partype: string;
  stats: Stats107;
};

export type Info107 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image107 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats107 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Rell = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info108;
  image: Image108;
  tags: string[];
  partype: string;
  stats: Stats108;
};

export type Info108 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image108 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats108 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Renata = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info109;
  image: Image109;
  tags: string[];
  partype: string;
  stats: Stats109;
};

export type Info109 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image109 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats109 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Renekton = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info110;
  image: Image110;
  tags: string[];
  partype: string;
  stats: Stats110;
};

export type Info110 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image110 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats110 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Rengar = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info111;
  image: Image111;
  tags: string[];
  partype: string;
  stats: Stats111;
};

export type Info111 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image111 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats111 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Riven = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info112;
  image: Image112;
  tags: string[];
  partype: string;
  stats: Stats112;
};

export type Info112 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image112 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats112 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Rumble = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info113;
  image: Image113;
  tags: string[];
  partype: string;
  stats: Stats113;
};

export type Info113 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image113 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats113 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ryze = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info114;
  image: Image114;
  tags: string[];
  partype: string;
  stats: Stats114;
};

export type Info114 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image114 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats114 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Samira = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info115;
  image: Image115;
  tags: string[];
  partype: string;
  stats: Stats115;
};

export type Info115 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image115 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats115 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Sejuani = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info116;
  image: Image116;
  tags: string[];
  partype: string;
  stats: Stats116;
};

export type Info116 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image116 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats116 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Senna = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info117;
  image: Image117;
  tags: string[];
  partype: string;
  stats: Stats117;
};

export type Info117 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image117 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats117 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Seraphine = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info118;
  image: Image118;
  tags: string[];
  partype: string;
  stats: Stats118;
};

export type Info118 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image118 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats118 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Sett = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info119;
  image: Image119;
  tags: string[];
  partype: string;
  stats: Stats119;
};

export type Info119 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image119 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats119 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Shaco = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info120;
  image: Image120;
  tags: string[];
  partype: string;
  stats: Stats120;
};

export type Info120 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image120 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats120 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Shen = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info121;
  image: Image121;
  tags: string[];
  partype: string;
  stats: Stats121;
};

export type Info121 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image121 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats121 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Shyvana = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info122;
  image: Image122;
  tags: string[];
  partype: string;
  stats: Stats122;
};

export type Info122 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image122 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats122 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Singed = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info123;
  image: Image123;
  tags: string[];
  partype: string;
  stats: Stats123;
};

export type Info123 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image123 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats123 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Sion = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info124;
  image: Image124;
  tags: string[];
  partype: string;
  stats: Stats124;
};

export type Info124 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image124 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats124 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Sivir = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info125;
  image: Image125;
  tags: string[];
  partype: string;
  stats: Stats125;
};

export type Info125 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image125 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats125 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Skarner = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info126;
  image: Image126;
  tags: string[];
  partype: string;
  stats: Stats126;
};

export type Info126 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image126 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats126 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Smolder = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info127;
  image: Image127;
  tags: string[];
  partype: string;
  stats: Stats127;
};

export type Info127 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image127 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats127 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Sona = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info128;
  image: Image128;
  tags: string[];
  partype: string;
  stats: Stats128;
};

export type Info128 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image128 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats128 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Soraka = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info129;
  image: Image129;
  tags: string[];
  partype: string;
  stats: Stats129;
};

export type Info129 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image129 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats129 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Swain = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info130;
  image: Image130;
  tags: string[];
  partype: string;
  stats: Stats130;
};

export type Info130 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image130 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats130 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Sylas = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info131;
  image: Image131;
  tags: string[];
  partype: string;
  stats: Stats131;
};

export type Info131 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image131 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats131 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Syndra = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info132;
  image: Image132;
  tags: string[];
  partype: string;
  stats: Stats132;
};

export type Info132 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image132 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats132 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type TahmKench = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info133;
  image: Image133;
  tags: string[];
  partype: string;
  stats: Stats133;
};

export type Info133 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image133 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats133 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Taliyah = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info134;
  image: Image134;
  tags: string[];
  partype: string;
  stats: Stats134;
};

export type Info134 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image134 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats134 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Talon = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info135;
  image: Image135;
  tags: string[];
  partype: string;
  stats: Stats135;
};

export type Info135 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image135 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats135 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Taric = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info136;
  image: Image136;
  tags: string[];
  partype: string;
  stats: Stats136;
};

export type Info136 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image136 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats136 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Teemo = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info137;
  image: Image137;
  tags: string[];
  partype: string;
  stats: Stats137;
};

export type Info137 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image137 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats137 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Thresh = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info138;
  image: Image138;
  tags: string[];
  partype: string;
  stats: Stats138;
};

export type Info138 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image138 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats138 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Tristana = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info139;
  image: Image139;
  tags: string[];
  partype: string;
  stats: Stats139;
};

export type Info139 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image139 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats139 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Trundle = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info140;
  image: Image140;
  tags: string[];
  partype: string;
  stats: Stats140;
};

export type Info140 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image140 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats140 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Tryndamere = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info141;
  image: Image141;
  tags: string[];
  partype: string;
  stats: Stats141;
};

export type Info141 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image141 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats141 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type TwistedFate = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info142;
  image: Image142;
  tags: string[];
  partype: string;
  stats: Stats142;
};

export type Info142 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image142 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats142 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Twitch = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info143;
  image: Image143;
  tags: string[];
  partype: string;
  stats: Stats143;
};

export type Info143 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image143 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats143 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Udyr = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info144;
  image: Image144;
  tags: string[];
  partype: string;
  stats: Stats144;
};

export type Info144 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image144 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats144 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Urgot = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info145;
  image: Image145;
  tags: string[];
  partype: string;
  stats: Stats145;
};

export type Info145 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image145 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats145 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Varus = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info146;
  image: Image146;
  tags: string[];
  partype: string;
  stats: Stats146;
};

export type Info146 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image146 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats146 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Vayne = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info147;
  image: Image147;
  tags: string[];
  partype: string;
  stats: Stats147;
};

export type Info147 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image147 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats147 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Veigar = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info148;
  image: Image148;
  tags: string[];
  partype: string;
  stats: Stats148;
};

export type Info148 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image148 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats148 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Velkoz = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info149;
  image: Image149;
  tags: string[];
  partype: string;
  stats: Stats149;
};

export type Info149 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image149 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats149 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Vex = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info150;
  image: Image150;
  tags: string[];
  partype: string;
  stats: Stats150;
};

export type Info150 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image150 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats150 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Vi = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info151;
  image: Image151;
  tags: string[];
  partype: string;
  stats: Stats151;
};

export type Info151 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image151 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats151 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Viego = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info152;
  image: Image152;
  tags: string[];
  partype: string;
  stats: Stats152;
};

export type Info152 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image152 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats152 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Viktor = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info153;
  image: Image153;
  tags: string[];
  partype: string;
  stats: Stats153;
};

export type Info153 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image153 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats153 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Vladimir = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info154;
  image: Image154;
  tags: string[];
  partype: string;
  stats: Stats154;
};

export type Info154 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image154 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats154 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Volibear = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info155;
  image: Image155;
  tags: string[];
  partype: string;
  stats: Stats155;
};

export type Info155 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image155 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats155 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Warwick = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info156;
  image: Image156;
  tags: string[];
  partype: string;
  stats: Stats156;
};

export type Info156 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image156 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats156 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Xayah = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info157;
  image: Image157;
  tags: string[];
  partype: string;
  stats: Stats157;
};

export type Info157 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image157 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats157 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Xerath = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info158;
  image: Image158;
  tags: string[];
  partype: string;
  stats: Stats158;
};

export type Info158 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image158 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats158 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type XinZhao = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info159;
  image: Image159;
  tags: string[];
  partype: string;
  stats: Stats159;
};

export type Info159 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image159 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats159 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Yasuo = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info160;
  image: Image160;
  tags: string[];
  partype: string;
  stats: Stats160;
};

export type Info160 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image160 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats160 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Yone = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info161;
  image: Image161;
  tags: string[];
  partype: string;
  stats: Stats161;
};

export type Info161 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image161 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats161 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Yorick = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info162;
  image: Image162;
  tags: string[];
  partype: string;
  stats: Stats162;
};

export type Info162 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image162 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats162 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Yuumi = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info163;
  image: Image163;
  tags: string[];
  partype: string;
  stats: Stats163;
};

export type Info163 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image163 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats163 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Zac = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info164;
  image: Image164;
  tags: string[];
  partype: string;
  stats: Stats164;
};

export type Info164 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image164 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats164 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Zed = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info165;
  image: Image165;
  tags: string[];
  partype: string;
  stats: Stats165;
};

export type Info165 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image165 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats165 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Zeri = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info166;
  image: Image166;
  tags: string[];
  partype: string;
  stats: Stats166;
};

export type Info166 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image166 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats166 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Ziggs = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info167;
  image: Image167;
  tags: string[];
  partype: string;
  stats: Stats167;
};

export type Info167 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image167 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats167 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Zilean = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info168;
  image: Image168;
  tags: string[];
  partype: string;
  stats: Stats168;
};

export type Info168 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image168 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats168 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Zoe = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info169;
  image: Image169;
  tags: string[];
  partype: string;
  stats: Stats169;
};

export type Info169 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image169 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats169 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Zyra = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info170;
  image: Image170;
  tags: string[];
  partype: string;
  stats: Stats170;
};

export type Info170 = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Image170 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Stats170 = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};
export type ChampionById = {
  type: string;
  format: string;
  version: string;
  data: ChampionByIDData;
};

export type ChampionByIDData = {
  [championID: string]: ChampionByID;
};

export type ChampionByID = {
  id: string;
  key: string;
  name: string;
  title: string;
  image: Image;
  skins: Skin[];
  lore: string;
  blurb: string;
  allytips: string[];
  enemytips: string[];
  tags: string[];
  partype: string;
  info: Info;
  stats: Stats;
  spells: Spell[];
  passive: Passive;
  recommended: any[];
};

export type Image = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Skin = {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
};

export type Info = {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
};

export type Stats = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
};

export type Spell = {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  leveltip: Leveltip;
  maxrank: number;
  cooldown: number[];
  cooldownBurn: string;
  cost: number[];
  costBurn: string;
  datavalues: Datavalues;
  effect: number[] | undefined[];
  effectBurn: string | undefined[];
  vars: any[];
  costType: string;
  maxammo: string;
  range: number[];
  rangeBurn: string;
  image: Image2;
  resource: string;
};

export type Leveltip = {
  label: string[];
  effect: string[];
};

export type Datavalues = {};

export type Image2 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Passive = {
  name: string;
  description: string;
  image: Image3;
};

export type Image3 = {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
};
