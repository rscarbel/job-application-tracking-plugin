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

function parseSalaryInfo(text) {
  const lowercaseText = text.toLowerCase();

  // First, check for obvious salary phrase
  if (
    /\$[\d,.]+ *- *\$[\d,.]+ (?:a|per) (?:year|hour|month|week)/i.test(text)
  ) {
    // Check if this clearly looks like a salary range (not a market value)
    const salaryRangeMatch = text.match(
      /\$([\d,.]+) *- *\$([\d,.]+) (?:a|per) (year|hour|month|week)/i
    );

    if (salaryRangeMatch) {
      let min = parseFloat(salaryRangeMatch[1].replace(/,/g, ''));
      let max = parseFloat(salaryRangeMatch[2].replace(/,/g, ''));
      const period = salaryRangeMatch[3].toLowerCase();

      // Convert to appropriate frequency
      let frequency;
      if (period === 'year') {
        frequency = 'ANNUALLY';
      } else if (period === 'hour') {
        frequency = 'HOURLY';
      } else if (period === 'month') {
        frequency = 'MONTHLY';
      } else if (period === 'week') {
        frequency = 'WEEKLY';
      }

      // Double-check that these are realistic values
      if (isRealisticSalary(min) && isRealisticSalary(max) && frequency) {
        return {
          salaryRangeMin: min.toString(),
          salaryRangeMax: max.toString(),
          payFrequency: frequency,
        };
      }
    }
  }

  // Check for things that are definitely NOT salaries

  // Check for "B" or "b" at the end of a number, possibly with a plus sign
  if (/\$\d+\s*[bB]\+?/i.test(text)) {
    return {};
  }

  // Check for "M" or "m" at the end of a number in contexts that suggest market size
  if (/\$\d+\s*[mM]\+?.*(market|valuation|industry|cap)/i.test(text)) {
    return {};
  }

  // Check for "annualized" specifically, which is a giveaway for market context
  if (/\$\d+.*(annualized)/i.test(text)) {
    return {};
  }

  // Check for market size mentions with common keywords
  if (
    /\$\d+\s*(?:[kmbt])?\+?\s*(?:market|industry|annualized|revenue|secondaries|equity)/i.test(
      text
    )
  ) {
    return {};
  }

  // Context detection for financial terms
  const financialContextPattern =
    /\$\d[\d,.]*\s*(?:[kmbt])?\+?(?:\s*[-+])?(?:\s*[\w\s]{0,30}(?:market|revenue|valuation|worth|budget|funding|investment|raise|industry|annualized|secondaries|equity))/i;

  if (financialContextPattern.test(text)) {
    return {};
  }

  // Handle salary ranges - this is original logic
  const rangeRegex =
    /\$\s*([\d,.]+)k?\s*(?:[-–—]|to|\bto\b)\s*\$?\s*([\d,.]+)k?(?!\s*(?:million|billion|trillion|m\b|b\b|t\b))/i;

  const rangeMatch = text.match(rangeRegex);

  if (rangeMatch) {
    let min = rangeMatch[1].replace(/,/g, '');
    let max = rangeMatch[2].replace(/,/g, '');

    // Handle k notation (e.g., $50k)
    if (min.endsWith('k')) {
      min = parseFloat(min.slice(0, -1)) * 1000;
    } else {
      min = parseFloat(min);
    }

    if (max.endsWith('k')) {
      max = parseFloat(max.slice(0, -1)) * 1000;
    } else {
      max = parseFloat(max);
    }

    if (!isRealisticSalary(min) || !isRealisticSalary(max)) {
      return {};
    }

    const frequency = determinePayFrequency(lowercaseText, Math.min(min, max));

    if (!frequency) {
      return {};
    }

    return {
      salaryRangeMin: min.toString(),
      salaryRangeMax: max.toString(),
      payFrequency: frequency,
    };
  }

  // If no range found, look for single salary amount
  // exclude non-salary indicators but don't be too restrictive
  const amountRegex =
    /\$\s*([\d,.]+)k?(?!\s*(?:[-–—]|to|\bto\b)\s*\$?)(?!\s*(?:million|billion|trillion))/i;

  const amountMatch = text.match(amountRegex);

  if (amountMatch) {
    let amount = amountMatch[1].replace(/,/g, '');

    if (amount.endsWith('k')) {
      amount = parseFloat(amount.slice(0, -1)) * 1000;
    } else {
      amount = parseFloat(amount);
    }

    if (!isRealisticSalary(amount)) {
      return {};
    }

    const frequency = determinePayFrequency(lowercaseText, amount);

    // Only return salary info if we could determine a frequency
    if (!frequency) {
      return {};
    }

    return {
      payAmount: amount.toString(),
      payFrequency: frequency,
    };
  }

  // No salary information found
  return {};
}

function isRealisticSalary(amount) {
  // Most realistic salaries would fall within these ranges
  // For hourly wages: $7 to $200 per hour
  // For annual salaries: $15,000 to $2,000,000

  // If it's a very large number (like 100B) or very small, it's probably not a salary
  if (amount > 2000000 || amount < 7) {
    return false;
  }

  return true;
}

function determinePayFrequency(text, amount) {
  if (!isRealisticSalary(amount)) {
    return null;
  }

  const salaryIndicators =
    /\b(?:salary|compensation|pay|wage|earning|offer|income|package)\b/i;
  const compensationSection =
    /\b(?:compensation|benefits|what\s+we\s+offer)\b/i;

  // If we don't see compensation indicators and we're not in a compensation section
  if (!salaryIndicators.test(text) && !compensationSection.test(text)) {
    // Require stronger frequency indicators if not in clear salary context
    const strongFrequencyIndicators =
      /\b(?:per\s+hour|hourly\s+rate|yearly\s+salary|annual\s+income|per\s+year)\b/i;
    if (!strongFrequencyIndicators.test(text)) {
      return null;
    }
  }

  // Check for explicit frequency mentions
  if (/\b(?:per\s+hour|hour|hourly|hr)\b/i.test(text)) {
    return 'HOURLY';
  } else if (/\bweekly\b/i.test(text)) {
    return 'WEEKLY';
  } else if (/\b(?:bi-?weekly|every\s+(?:other|two)\s+weeks?)\b/i.test(text)) {
    return 'BIWEEKLY';
  } else if (/\b(?:month|monthly)\b/i.test(text)) {
    return 'MONTHLY';
  } else if (/\b(?:annual|annually|year|yearly|per\s+year)\b/i.test(text)) {
    return 'ANNUALLY';
  }

  // If we're in a compensation section but no explicit frequency was found,
  // make a more educated guess based on amount
  if (compensationSection.test(text)) {
    if (amount <= 150) {
      return 'HOURLY';
    } else if (amount <= 1000) {
      return 'WEEKLY';
    } else if (amount <= 5000) {
      return 'BIWEEKLY';
    } else if (amount <= 20000) {
      return 'MONTHLY';
    } else {
      return 'ANNUALLY';
    }
  }

  // this should be unreachable
  return null;
}

function extractCompanyWebsite(text, companyName) {
  const websitePattern =
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
  const websiteMatches = [...text.matchAll(websitePattern)];

  if (websiteMatches.length > 0) {
    const normalizedCompanyName = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const companyWebsite = websiteMatches.find((match) => {
      const fullUrl = match[0];
      const lowerUrl = fullUrl.toLowerCase();

      if (lowerUrl.includes(normalizedCompanyName)) {
        return true;
      }

      return (
        !lowerUrl.includes('linkedin.com') &&
        !lowerUrl.includes('indeed.com') &&
        !lowerUrl.includes('facebook.com') &&
        !lowerUrl.includes('twitter.com') &&
        !lowerUrl.includes('instagram.com') &&
        !lowerUrl.includes('youtube.com') &&
        !lowerUrl.includes('github.com') &&
        !lowerUrl.includes('example.com')
      );
    });

    if (companyWebsite) {
      const websiteUrl = companyWebsite[0];
      return websiteUrl.startsWith('http')
        ? websiteUrl
        : `https://${websiteUrl}`;
    }
  }

  return '';
}

function parseLocationText(locationText) {
  if (!locationText)
    return { city: '', state: '', postalCode: '', country: '' };

  // Handle formats like "Durham, NC 27713" or "Chapel Hill, NC"
  const locationMatch = locationText.match(/^([^,]+),\s*([A-Z]{2})\s*(\d{5})?/);

  if (locationMatch) {
    return {
      city: locationMatch[1].trim(),
      state: locationMatch[2].trim(),
      postalCode: locationMatch[3] ? locationMatch[3].trim() : '',
      country: '',
    };
  } else {
    // Handle more complex formats or international locations
    const locationParts = locationText.split(/,\s*/);
    const result = { city: '', state: '', postalCode: '', country: '' };

    if (locationParts.length >= 1) {
      result.city = locationParts[0].trim();
    }

    if (locationParts.length >= 2) {
      // Check if second part has a postal code
      const statePostalMatch = locationParts[1].match(/([A-Z]{2})\s*(\d{5})?/);
      if (statePostalMatch) {
        result.state = statePostalMatch[1].trim();
        if (statePostalMatch[2]) {
          result.postalCode = statePostalMatch[2].trim();
        }
      } else {
        result.state = locationParts[1].trim();
      }
    }

    if (locationParts.length >= 3) {
      result.country = locationParts[2].trim();
    }

    return result;
  }
}

function detectIndustry(jobDescription) {
  const industryKeywords = {
    HEALTHCARE: [
      '\\bhealthcare\\b',
      '\\bmedical\\b',
      '\\bhospital\\b',
      '\\bhealth\\b',
      '\\bHIPAA\\b',
      '\\bclinical\\b',
      '\\bpatient\\b',
    ],
    TECHNOLOGY: [
      '\\btechnology\\b',
      '\\btech\\b',
      '\\bsoftware\\b',
      '\\bIT\\b',
      '\\bcloud\\b',
      '\\bdigital\\b',
      '\\bSaaS\\b',
    ],
    FINANCE: [
      '\\bfinance\\b',
      '\\bfinancial\\b',
      '\\bbanking\\b',
      '\\binvestment\\b',
      '\\baccounting\\b',
      '\\binsurance\\b',
    ],
    CONSULTING: [
      '\\bconsulting\\b',
      '\\badvisory\\b',
      '\\bprofessional services\\b',
      '\\bconsultancy\\b',
    ],
    SOFTWARE: [
      '\\bsoftware\\b',
      '\\bdevelopment\\b',
      '\\bprogramming\\b',
      '\\bapplication\\b',
      '\\bplatform\\b',
    ],
    TELECOMMUNICATIONS: [
      '\\btelecommunications\\b',
      '\\btelecom\\b',
      '\\bnetwork\\b',
      '\\bwireless\\b',
    ],
    EDUCATION: [
      '\\beducation\\b',
      '\\buniversity\\b',
      '\\bcollege\\b',
      '\\bacademic\\b',
      '\\bschool\\b',
      '\\blearning\\b',
    ],
    MANUFACTURING: [
      '\\bmanufacturing\\b',
      '\\bproduction\\b',
      '\\bindustrial\\b',
      '\\bfactory\\b',
    ],
    RETAIL: [
      '\\bretail\\b',
      '\\bstore\\b',
      '\\bsales\\b',
      '\\bcommerce\\b',
      '\\bmerchandise\\b',
    ],
    ENGINEERING: ['\\bengineering\\b', '\\bengineer\\b', '\\btechnical\\b'],
    MEDIA: [
      '\\bmedia\\b',
      '\\badvertising\\b',
      '\\bmarketing\\b',
      '\\bcommunications\\b',
      '\\bpublishing\\b',
    ],
    BIOTECHNOLOGY: [
      '\\bbiotech\\b',
      '\\bbiotechnology\\b',
      '\\blife sciences\\b',
      '\\bpharmaceutical\\b',
    ],
    ENERGY: [
      '\\benergy\\b',
      '\\boil\\b',
      '\\bgas\\b',
      '\\brenewable\\b',
      '\\bpower\\b',
      '\\butilities\\b',
    ],
    GOVERNMENT: [
      '\\bgovernment\\b',
      '\\bfederal\\b',
      '\\bstate\\b',
      '\\bpublic sector\\b',
      '\\bmunicipal\\b',
    ],
    ENTERTAINMENT: [
      '\\bentertainment\\b',
      '\\bgaming\\b',
      '\\bmusic\\b',
      '\\bfilm\\b',
      '\\btelevision\\b',
    ],
    AEROSPACE: [
      '\\baerospace\\b',
      '\\baviation\\b',
      '\\bdefense\\b',
      '\\bmilitary\\b',
    ],
  };

  const jobDescriptionLower = jobDescription.toLowerCase();
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'i');
      if (regex.test(jobDescriptionLower)) {
        return industry;
      }
    }
  }

  return '';
}

function detectWorkMode(text) {
  const lowerText = text.toLowerCase();

  // Use word boundary markers (\b) to ensure whole word matching
  if (/\bhybrid\b/i.test(lowerText)) {
    return 'HYBRID';
  } else if (
    /\bremote\b/i.test(lowerText) ||
    /\bwork from home\b/i.test(lowerText) ||
    /\bwfh\b/i.test(lowerText)
  ) {
    return 'REMOTE';
  } else if (
    /\bon-site\b/i.test(lowerText) ||
    /\bonsite\b/i.test(lowerText) ||
    /\bin office\b/i.test(lowerText) ||
    /\bin-office\b/i.test(lowerText)
  ) {
    return 'ONSITE';
  }

  return '';
}

function detectWorkType(text) {
  const lowerText = text.toLowerCase();

  // Use word boundary markers (\b) to ensure whole word matching
  if (/\bfull-time\b/i.test(lowerText) || /\bfulltime\b/i.test(lowerText)) {
    return 'FULL_TIME';
  } else if (
    /\bpart-time\b/i.test(lowerText) ||
    /\bparttime\b/i.test(lowerText)
  ) {
    return 'PART_TIME';
  } else if (
    /\bcontract\b/i.test(lowerText) ||
    /\bcontractor\b/i.test(lowerText)
  ) {
    return 'CONTRACT';
  } else if (/\btemporary\b/i.test(lowerText) || /\btemp\b/i.test(lowerText)) {
    return 'TEMPORARY';
  } else if (
    /\binternship\b/i.test(lowerText) ||
    /\bintern\b/i.test(lowerText)
  ) {
    return 'INTERNSHIP';
  }

  return '';
}

window.parserUtils = {
  cleanText,
  detectIndustry,
  detectWorkMode,
  detectWorkType,
  determineCompanySize,
  extractCompanyWebsite,
  extractWithRegex,
  getTextFromElement,
  parseLocationText,
  parseSalaryInfo,
};
