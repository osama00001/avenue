# Strapi setup notes

Use Strapi Cloud and create the content types below. The Next.js integration
expects these names and fields.

## Single types

### navigation
- `mainMenu` (repeatable component `navItem`)
- `utilityMenu` (repeatable component `navItem`)

`navItem` fields:
- `label` (text)
- `href` (text)
- `icon` (text, optional; e.g. `faLocationDot`)
- `enableMegaMenu` (boolean, optional)

### footer
- `columns` (repeatable component `footerColumn`)

`footerColumn` fields:
- `title` (text)
- `links` (repeatable component `footerLink`)

`footerLink` fields:
- `label` (text)
- `href` (text)

### site-settings
- `logo` (media, single image)
- `saleBarText` (text)
- `saleBarLink` (text)
- `deliveryText` (text)

## Collection types

### page
- `title` (text)
- `slug` (UID based on title)
- `level` (number; used for footer columns)
- `content` (rich text / HTML)

### social-link
- `label` (text)
- `url` (text)
- `icon` (text; e.g. `faSquareFacebook`, `faInstagram`)
- `order` (number)
- `enabled` (boolean)

## Seed data (initial pages)
- `terms-and-conditions` (level 2, title "Terms & Conditions")
- `privacy-policy` (level 2, title "Privacy Policy")
- `cookie-policy` (level 2, title "Cookie Policy")

After creating these entries, publish them so the Next.js site can load them.
