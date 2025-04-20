/** Helper function to extract text from an element if it exists */
function getTextFromElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

/** Helper function to clean text (remove extra whitespace, etc.) */
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/** Helper function to extract a value using a regular expression */
function extractWithRegex(text, regex, groupIndex = 1) {
  const match = text.match(regex);
  return match ? match[groupIndex] : '';
}

/** Helper function to determine company size */
function determineCompanySize(numberOfEmployees) {
  let size = -1;
  if (typeof numberOfEmployees === 'string') {
    size = parseInt(numberOfEmployees.replace(/,/g, ''));
  } else if (typeof numberOfEmployees === 'number') {
    size = numberOfEmployees;
  } else if (numberOfEmployees === null || numberOfEmployees === undefined) {
    size = -1;
  } else {
    console.error(
      'Invalid type for numberOfEmployees:',
      typeof numberOfEmployees
    );
    return null;
  }

  if (size == -1 || isNaN(size)) {
    return null;
  }
  if (numberOfEmployees < 10) {
    return 'TINY';
  } else if (numberOfEmployees < 100) {
    return 'SMALL';
  } else if (numberOfEmployees < 100) {
    return 'MEDIUM';
  } else if (numberOfEmployees < 5000) {
    return 'LARGE';
  } else {
    return 'MASSIVE';
  }
}

window.parserUtils = {
  getTextFromElement,
  cleanText,
  extractWithRegex,
  determineCompanySize,
};
