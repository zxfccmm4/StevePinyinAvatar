
/**
 * Generates a VCard 3.0 string.
 * @param {Array<{ name: string, imageBase64: string }>} contacts
 * @param {Object} options
 * @param {boolean} options.isCompany - Add X-ABShowAs:COMPANY
 * @param {string} options.organization - Organization name
 * @param {string} options.imageType - 'JPEG' or 'PNG' (default JPEG)
 * @returns {string} vCard string
 */
export const generateVCard = (contacts, options = {}) => {
  const { isCompany = false, organization = '', imageType = 'JPEG' } = options;

  const cards = contacts.map((contact) => {
    // Remove data:image/...;base64, prefix if present
    const cleanBase64 = contact.imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const parts = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${contact.name}`,
      `N:;${contact.name};;;`
    ];

    if (organization) {
      parts.push(`ORG:${organization}`);
    }

    if (isCompany) {
      parts.push("X-ABShowAs:COMPANY");
    }

    parts.push(`PHOTO;ENCODING=b;TYPE=${imageType}:${cleanBase64}`);
    parts.push("END:VCARD");

    return parts.join("\n");
  });

  return cards.join("\n");
};
