export type ActiveTab = 'resep' | 'sopan' | 'curhat' | 'tanya' | 'belanja' | 'kamus' | 'solusi';
export type SakuLanguage = 'id' | 'en' | 'zh' | 'ar';

export interface ResepResult {
  namaMasakan: string;
  porsi: string;
  waktuMemasak: string;
  perkiraanBiaya: string;
  bahanBahan: string[];
  langkahLangkah: string[];
  tipsCerdas: string;
}

export interface SopanResult {
  pilihanSangatSopan: string;
  pilihanRamahHangat: string;
  pilihanSingkatPadat: string;
}

export interface CurhatResult {
  balasanSobat: string;
  afirmasiSaku: string;
  aktivitasMenolong: string;
}

export interface TanyaResult {
  judulAnalogi: string;
  penjelasanPendek: string;
  satuKalimatInti: string;
}

export interface BelanjaItem {
  barang: string;
  takaran: string;
  estimasiBiaya: string;
  alternatifLebihMurah: string;
}

export interface BelanjaResult {
  namaRencana: string;
  totalEstimasi: string;
  tipsHemat: string;
  daftarBelanjaAnalis: BelanjaItem[];
}

export interface KamusResult {
  kataAsli: string;
  artiHarfiah: string;
  penjelasanSantai: string;
  contohKalimat: string;
}

export interface SolusiResult {
  namaMasalah: string;
  tingkatKesulitan: string;
  bahanRumahan: string[];
  langkahSolusi: string[];
  tipsPencegahan: string;
}

export interface QuickIngredient {
  name: string;
  category: 'protein' | 'karbo' | 'sayur' | 'bumbu';
  icon: string;
}
