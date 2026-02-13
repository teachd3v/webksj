import { groq } from 'next-sanity';

export const PERGURUAN_QUERY = groq`*[_type == "perguruan"]{
  _id,
  name,
  "slug": slug.current,
  style,
  members,
  location,
  "logo": logo.asset->url
}`;

export const PERGURUAN_DETAIL_QUERY = groq`*[_type == "perguruan" && slug.current == $slug][0]{
  _id,
  name,
  style,
  members,
  location,
  description,
  history,
  masterName,
  contact,
  "logo": logo.asset->url
}`;

export const NEWS_QUERY = groq`*[_type == "news"] | order(date desc){
  _id,
  title,
  "slug": slug.current,
  date,
  excerpt,
  "image": image.asset->url
}`;

export const NEWS_DETAIL_QUERY = groq`*[_type == "news" && slug.current == $slug][0]{
  _id,
  title,
  date,
  excerpt,
  content,
  "image": image.asset->url
}`;

export const PRODUCTS_QUERY = groq`*[_type == "product"]{
  _id,
  name,
  price,
  "image": image.asset->url,
  whatsappLink
}`;

export const GALLERY_QUERY = groq`*[_type == "gallery"]{
  _id,
  caption,
  "image": image.asset->url
}`;

export const STATS_SETTINGS_QUERY = groq`*[_type == "statsSettings"][0]{
  totalPerguruan,
  totalAliran,
  totalAnggota
}`;

export const SETTINGS_QUERY = groq`*[_type == "siteSettings"][0]{
  heroTagline,
  heroDescription
}`;

export const ORGANISASI_QUERY = groq`*[_type == "organisasi"][0]{
  title,
  pengurusInti[]{
    role,
    name
  },
  bidangList[]{
    title,
    leader,
    members
  }
}`;
