async function detectJobDetails() {
  try {
    // Get the current URL
    const url = window.location.href;
    const domain = new URL(url).hostname;

    console.info('Detecting job details for URL:', url);
    console.info('Domain detected:', domain);

    // Default empty job details object with all possible fields
    const defaultJobDetails = {
      companyName: '',
      jobTitle: '',
      location: {
        city: '',
        state: '',
        country: '',
        postalCode: '',
        streetAddress: '',
        streetAddress2: '',
      },
      compensation: {
        payAmount: '',
        payFrequency: '',
        salaryRangeMin: '',
        salaryRangeMax: '',
      },
      jobDetails: {
        workMode: '',
        workType: '',
        description: '',
        applicationLink: url,
      },
      companyDetails: {
        industry: '',
        website: '',
        linkedin: '',
        size: '',
        type: '',
        desirability: '',
      },
      source: domain,
      notes: '',
    };

    // Select the appropriate parser based on the domain
    const parser = getParserForDomain(domain);

    if (!parser) {
      console.warn(`No parser found for domain: ${domain}`);
      return null;
    }

    console.log('Parser found:', parser);

    // Execute the domain-specific parser
    console.info(`Using parser for domain: ${domain}`);
    const jobDetails = await parser(defaultJobDetails);

    console.info('Job details detected:', jobDetails);

    return jobDetails;
  } catch (error) {
    console.error('Error detecting job details:', error);
    return null;
  }
}

// detectJobDetails.js

// Modified getParserForDomain function to use global parsers
function getParserForDomain(domain) {
  // Strip 'www.' prefix if present
  const normalizedDomain = domain.replace(/^www\./i, '');

  console.info('Normalized domain:', normalizedDomain);

  const parsers = {
    'linkedin.com': window.linkedinParser,
    'indeed.com': window.indeedParser,
    'glassdoor.com': window.glassdoorParser,
    'monster.com': window.monsterParser,
    'ziprecruiter.com': window.zipRecruiterParser,
    'dice.com': window.diceParser,
    'wellfound.com': window.wellfoundParser,
    'simplyhired.com': window.simplyHiredParser,
  };

  for (const knownDomain in parsers) {
    if (normalizedDomain.includes(knownDomain)) {
      const parser = parsers[knownDomain];

      return parser || null;
    }
  }

  console.info(`No specific parser found for domain: ${normalizedDomain}`);
  return null;
}

// Generic parser that attempts to find job details using common patterns
// This serves as a fallback when no domain-specific parser is available
async function genericParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // Try to find job title from common elements
    const possibleTitleElements = [
      document.querySelector('h1'),
      ...document.querySelectorAll(
        'h1, h2, h3, .job-title, .position-title, [data-testid*="title"], [class*="title"]'
      ),
    ];

    for (const element of possibleTitleElements) {
      if (element && element.textContent.trim()) {
        jobDetails.jobTitle = element.textContent.trim();
        break;
      }
    }

    // Try to find company name from common elements
    const possibleCompanyElements = [
      ...document.querySelectorAll(
        '[class*="company"], [class*="employer"], [data-testid*="company"], .organization, [class*="organization"]'
      ),
    ];

    for (const element of possibleCompanyElements) {
      if (element && element.textContent.trim()) {
        jobDetails.companyName = element.textContent.trim();
        break;
      }
    }

    // Try to find salary information
    const pageSalaryText = document.body.textContent;
    const salaryPattern =
      /\$\s*([\d,]+)(?:\s*-\s*\$\s*([\d,]+))?(?:\s*(\/|\s+per\s+)(hour|year|month|week|day|annual))?/i;
    const salaryMatch = pageSalaryText.match(salaryPattern);

    if (salaryMatch) {
      if (salaryMatch[1]) {
        const minSalary = salaryMatch[1].replace(/,/g, '');
        jobDetails.compensation.salaryRangeMin = minSalary;

        if (salaryMatch[2]) {
          const maxSalary = salaryMatch[2].replace(/,/g, '');
          jobDetails.compensation.salaryRangeMax = maxSalary;
          // Set the average as the payAmount
          jobDetails.compensation.payAmount = (
            (parseFloat(minSalary) + parseFloat(maxSalary)) /
            2
          ).toString();
        } else {
          jobDetails.compensation.payAmount = minSalary;
        }
      }

      // Try to determine pay frequency
      if (salaryMatch[4]) {
        const frequencyMapping = {
          hour: 'HOURLY',
          year: 'ANNUALLY',
          annual: 'ANNUALLY',
          month: 'MONTHLY',
          week: 'WEEKLY',
          day: 'DAILY',
        };

        jobDetails.compensation.payFrequency =
          frequencyMapping[salaryMatch[4]] || '';
      }
    }

    return jobDetails;
  } catch (error) {
    console.error('Error in generic parser:', error);
    return defaultJobDetails;
  }
}

// SITE-SPECIFIC PARSERS
// These functions will be implemented with site-specific selectors and logic

async function indeedParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement Indeed-specific parsing logic
    console.info('Indeed parser not yet implemented');

    return await genericParser(jobDetails); // Fall back to generic parser for now
  } catch (error) {
    console.error('Error in Indeed parser:', error);
    return jobDetails;
  }
}

async function glassdoorParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement Glassdoor-specific parsing logic
    console.info('Glassdoor parser not yet implemented');

    return await genericParser(jobDetails);
  } catch (error) {
    console.error('Error in Glassdoor parser:', error);
    return jobDetails;
  }
}

async function monsterParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement Monster-specific parsing logic
    console.info('Monster parser not yet implemented');

    return await genericParser(jobDetails);
  } catch (error) {
    console.error('Error in Monster parser:', error);
    return jobDetails;
  }
}

async function zipRecruiterParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement ZipRecruiter-specific parsing logic
    console.info('ZipRecruiter parser not yet implemented');

    return await genericParser(jobDetails); // Fall back to generic parser for now
  } catch (error) {
    console.error('Error in ZipRecruiter parser:', error);
    return jobDetails;
  }
}

async function diceParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement Dice-specific parsing logic
    console.info('Dice parser not yet implemented');

    return await genericParser(jobDetails); // Fall back to generic parser for now
  } catch (error) {
    console.error('Error in Dice parser:', error);
    return jobDetails;
  }
}

async function wellfoundParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement Wellfound (formerly AngelList)-specific parsing logic
    console.info('Wellfound parser not yet implemented');

    return await genericParser(jobDetails); // Fall back to generic parser for now
  } catch (error) {
    console.error('Error in Wellfound parser:', error);
    return jobDetails;
  }
}

async function simplyHiredParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement SimplyHired-specific parsing logic
    console.info('SimplyHired parser not yet implemented');

    return await genericParser(jobDetails); // Fall back to generic parser for now
  } catch (error) {
    console.error('Error in SimplyHired parser:', error);
    return jobDetails;
  }
}

// Export the main function so it can be used in popup.js
window.detectJobDetails = detectJobDetails;
