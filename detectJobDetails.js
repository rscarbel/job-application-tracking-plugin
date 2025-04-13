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

    // If no specific parser is found, use the generic parser
    if (!parser) {
      console.info(
        `No specific parser found for domain: ${domain}. Using generic parser.`
      );
      return await genericParser(defaultJobDetails);
    }

    // Execute the domain-specific parser
    console.info(`Using parser for domain: ${domain}`);
    const jobDetails = await parser(defaultJobDetails);

    console.info('Detected job details:', jobDetails);
    return jobDetails;
  } catch (error) {
    console.error('Error detecting job details:', error);
    return null;
  }
}

// Registry of domain-specific parsers
function getParserForDomain(domain) {
  // Strip 'www.' prefix if present
  const normalizedDomain = domain.replace(/^www\./i, '');

  console.info('Normalized domain:', normalizedDomain);

  // Domain-specific parsers
  const parsers = {
    'linkedin.com': linkedinParser,
    'indeed.com': indeedParser,
    'glassdoor.com': glassdoorParser,
    'monster.com': monsterParser,
    'ziprecruiter.com': zipRecruiterParser,
    'dice.com': diceParser,
    'wellfound.com': wellfoundParser,
    'simplyhired.com': simplyHiredParser,
  };

  for (const knownDomain in parsers) {
    if (normalizedDomain.includes(knownDomain)) {
      console.info(`Found parser for domain: ${knownDomain}`);
      return parsers[knownDomain];
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

async function linkedinParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    console.info('Parsing LinkedIn job posting');

    // Extract the current job ID from URL if available
    const url = window.location.href;
    const currentJobIdMatch = url.match(/currentJobId=(\d+)/);
    const currentJobId = currentJobIdMatch ? currentJobIdMatch[1] : null;
    console.info('Current job ID from URL:', currentJobId);

    // If we have a job ID, look for the currently active job in the results list
    let activeJobElement = null;

    if (currentJobId) {
      // Try to find the active job card in the list
      activeJobElement = document.querySelector(
        `[data-job-id="${currentJobId}"]`
      );
      // Or find the job-details container with the right job ID
      if (!activeJobElement) {
        activeJobElement = document.querySelector(
          `.jobs-search__job-details--container[data-job-details-id="${currentJobId}"]`
        );
      }
    }

    // If we couldn't find by ID, look for the element with the "active" class
    if (!activeJobElement) {
      activeJobElement = document.querySelector(
        '.jobs-search-results-list__list-item--active'
      );
    }

    // Extract company name
    let companyName = '';
    // First try getting it from the detail view
    const companyDetailElement = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name'
    );
    if (companyDetailElement) {
      companyName = companyDetailElement.textContent.trim();
    }
    // If not found or if it's empty, try from the active job card
    else if (activeJobElement) {
      const companyCardElement = activeJobElement.querySelector(
        '.artdeco-entity-lockup__subtitle'
      );
      if (companyCardElement) {
        companyName = companyCardElement.textContent.trim();
      }
    }

    if (companyName) {
      jobDetails.companyName = companyName;
    }

    // Extract job title
    let jobTitle = '';
    // First try from detail view
    const jobTitleElement = document.querySelector(
      '.job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title'
    );
    if (jobTitleElement) {
      jobTitle = jobTitleElement.textContent.trim();
    }
    // If not found, try from active job card
    else if (activeJobElement) {
      const titleCardElement = activeJobElement.querySelector(
        '.job-card-list__title'
      );
      if (titleCardElement) {
        jobTitle = titleCardElement.textContent.trim();
      }
    }

    if (jobTitle) {
      jobDetails.jobTitle = jobTitle.replace('with verification', '').trim();
    }

    // Extract location
    let locationText = '';
    // Try detail view first
    const locationElements = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text, .jobs-unified-top-card__bullet'
    );

    // Look specifically for the location text which is typically the first tvm__text--low-emphasis that's not about posting date or applicants
    for (const element of locationElements) {
      const text = element.textContent.trim();
      if (
        text &&
        element.classList.contains('tvm__text--low-emphasis') &&
        !text.includes('Reposted') &&
        !text.includes('ago') &&
        !text.includes('people') &&
        !text.includes('clicked apply')
      ) {
        locationText = text;
        break;
      }
    }

    // If not found, try the job card
    if (!locationText && activeJobElement) {
      const locationCardElement = activeJobElement.querySelector(
        '.job-card-container__metadata-wrapper'
      );
      if (locationCardElement) {
        locationText = locationCardElement.textContent.trim();
      }
    }

    if (locationText) {
      // Parse location into city, state, country
      const locationParts = locationText.split(/,\s*/);

      if (locationParts.length >= 1) {
        jobDetails.location.city = locationParts[0]
          .replace(/\(.*\)$/, '')
          .trim();
      }

      if (locationParts.length >= 2) {
        jobDetails.location.state = locationParts[1].trim();
      }

      if (locationParts.length >= 3) {
        jobDetails.location.country = locationParts[2].trim();
      }

      // Extract work mode from location if present (Remote, Hybrid, On-site)
      if (locationText.includes('(Remote)')) {
        jobDetails.jobDetails.workMode = 'REMOTE';
      } else if (locationText.includes('(Hybrid)')) {
        jobDetails.jobDetails.workMode = 'HYBRID';
      } else if (locationText.includes('(On-site)')) {
        jobDetails.jobDetails.workMode = 'ONSITE';
      }
    }

    // Extract work mode from buttons if not found in location
    if (!jobDetails.jobDetails.workMode) {
      const workModeElements = document.querySelectorAll(
        '.job-details-fit-level-preferences button, .jobs-unified-top-card__job-insight'
      );
      workModeElements.forEach((element) => {
        const buttonText = element.textContent.trim().toUpperCase();
        if (buttonText.includes('REMOTE')) {
          jobDetails.jobDetails.workMode = 'REMOTE';
        } else if (
          buttonText.includes('ON-SITE') ||
          buttonText.includes('ONSITE')
        ) {
          jobDetails.jobDetails.workMode = 'ONSITE';
        } else if (buttonText.includes('HYBRID')) {
          jobDetails.jobDetails.workMode = 'HYBRID';
        }
      });
    }

    // Extract work type (Full-time, Part-time, etc.)
    const workTypeElements = document.querySelectorAll(
      '.job-details-fit-level-preferences button, .jobs-unified-top-card__job-insight'
    );
    let salaryFound = false;
    workTypeElements.forEach((element) => {
      const buttonText = element.textContent.trim();

      // First handle work type detection (unchanged)
      const upperButtonText = buttonText.toUpperCase();
      if (upperButtonText.includes('FULL-TIME')) {
        jobDetails.jobDetails.workType = 'FULL_TIME';
      } else if (upperButtonText.includes('PART-TIME')) {
        jobDetails.jobDetails.workType = 'PART_TIME';
      } else if (upperButtonText.includes('CONTRACT')) {
        jobDetails.jobDetails.workType = 'CONTRACT';
      } else if (upperButtonText.includes('TEMPORARY')) {
        jobDetails.jobDetails.workType = 'TEMPORARY';
      } else if (upperButtonText.includes('INTERNSHIP')) {
        jobDetails.jobDetails.workType = 'INTERNSHIP';
      }

      // Improved salary detection with better validation
      if (!salaryFound) {
        // Look for specific salary patterns
        const hourlyRatePattern =
          /\$(\d+(?:\.\d+)?)\s*\/\s*hr\s*-\s*\$(\d+(?:\.\d+)?)\s*\/\s*hr/i;
        const hourlyMatch = buttonText.match(hourlyRatePattern);

        if (hourlyMatch) {
          const minSalary = parseFloat(hourlyMatch[1]);
          const maxSalary = parseFloat(hourlyMatch[2]);

          // Validate that we have proper numbers before setting
          if (!isNaN(minSalary) && !isNaN(maxSalary)) {
            salaryFound = true;
            jobDetails.compensation.salaryRangeMin = minSalary.toString();
            jobDetails.compensation.salaryRangeMax = maxSalary.toString();
            jobDetails.compensation.payFrequency = 'HOURLY';
            console.info(
              `Found hourly rate: $${minSalary}/hr - $${maxSalary}/hr`
            );
          }
          return;
        }

        // If not an hourly range, check for single hourly rate pattern "$16/hr"
        const singleHourlyPattern = /\$(\d+(?:\.\d+)?)\s*\/\s*hr/i;
        const singleHourlyMatch = buttonText.match(singleHourlyPattern);

        if (singleHourlyMatch) {
          const hourlyRate = parseFloat(singleHourlyMatch[1]);

          // Only set values if we have a valid number
          if (!isNaN(hourlyRate)) {
            salaryFound = true;
            jobDetails.compensation.salaryRangeMin = hourlyRate.toString();
            jobDetails.compensation.salaryRangeMax = hourlyRate.toString();
            jobDetails.compensation.payFrequency = 'HOURLY';
            console.info(`Found single hourly rate: $${hourlyRate}/hr`);
          }
          return;
        }
      }
    });

    // After the forEach loop, add a check to see if we want to look for salary elsewhere
    if (!salaryFound) {
      // Try to find salary information in the job description
      const jobDescriptionElement = document.querySelector(
        '.jobs-description-content__text--stretch'
      );

      if (jobDescriptionElement) {
        const descriptionText = jobDescriptionElement.textContent;

        // Look for common salary patterns in the description
        const salaryPatterns = [
          /\$([0-9,.]+)K\s*-\s*\$([0-9,.]+)K\/yr/i,
          /\$([0-9,.]+)K\s*-\s*\$([0-9,.]+)K\s+per\s+year/i,
          /\$([0-9,.]+)[,\s]+([0-9]{3})\s*-\s*\$([0-9,.]+)[,\s]+([0-9]{3})/i,
          /([0-9,.]+)K\s*-\s*([0-9,.]+)K\s+(?:USD|EUR|GBP)/i,
          /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:\/|\s+)?(hr|hour|yr|year|mo|month|week|wk|day|annual)(?:\s*-\s*\$(\d+(?:,\d+)*(?:\.\d+)?))?/i,
        ];

        // Only search description text if we haven't found salary info yet
        for (const pattern of salaryPatterns) {
          const match = descriptionText.match(pattern);
          if (match) {
            let minSalary, maxSalary;

            // Extract and validate min salary
            if (match[1]) {
              minSalary = match[1].replace(/[,.]/g, '');
              if (minSalary.length <= 3) {
                minSalary = parseInt(minSalary) * 1000;
              } else {
                minSalary = parseInt(minSalary);
              }
            }

            // Extract and validate max salary - index varies based on pattern
            const maxSalaryIndex = pattern
              .toString()
              .includes('([0-9,.]+)[,\\s]+([0-9]{3})')
              ? 3
              : 2;
            if (match[maxSalaryIndex]) {
              maxSalary = match[maxSalaryIndex].replace(/[,.]/g, '');
              if (maxSalary.length <= 3) {
                maxSalary = parseInt(maxSalary) * 1000;
              } else {
                maxSalary = parseInt(maxSalary);
              }
            }

            // Only set values if both numbers are valid
            if (!isNaN(minSalary) && !isNaN(maxSalary)) {
              jobDetails.compensation.salaryRangeMin = minSalary.toString();
              jobDetails.compensation.salaryRangeMax = maxSalary.toString();

              // Determine frequency
              if (
                match[0].includes('/yr') ||
                match[0].includes('per year') ||
                match[0].includes('annual')
              ) {
                jobDetails.compensation.payFrequency = 'ANNUALLY';
              } else if (
                match[0].includes('/mo') ||
                match[0].includes('per month')
              ) {
                jobDetails.compensation.payFrequency = 'MONTHLY';
              } else if (
                match[0].includes('/hr') ||
                match[0].includes('per hour')
              ) {
                jobDetails.compensation.payFrequency = 'HOURLY';
              }

              salaryFound = true;
              break;
            }
          }
        }
      }
    }

    // Extract job description/notes
    const jobDescriptionElement = document.querySelector(
      '.jobs-description-content__text--stretch, .jobs-description__content'
    );
    if (jobDescriptionElement) {
      jobDetails.notes = jobDescriptionElement.textContent
        .trim()
        .replace(/\s+/g, ' ');
    }

    // Extract company LinkedIn URL
    const companyLinkElement = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name a'
    );
    if (companyLinkElement) {
      const companyLink = companyLinkElement.getAttribute('href');
      if (companyLink) {
        // Convert relative URLs to absolute
        const baseUrl = 'https://www.linkedin.com';
        const absoluteUrl = companyLink.startsWith('/')
          ? `${baseUrl}${companyLink}`
          : companyLink;

        jobDetails.companyDetails.linkedin = absoluteUrl;
      }
    }

    // Try to determine company size from employees count
    const companyInfoSection = document.querySelector('.jobs-company__box');
    if (companyInfoSection) {
      const companyInfoText = companyInfoSection.textContent.toLowerCase();

      // Try to get company size from "X+ employees" text
      const employeesMatch = companyInfoText.match(
        /(\d+,\d+\+|\d+\+)\s*employees/
      );
      if (employeesMatch) {
        const employeesText = employeesMatch[1];
        // For ranges like "10,001+" we can determine it's MASSIVE
        if (
          employeesText.includes('10,001+') ||
          employeesText.includes('5,001+') ||
          companyInfoText.includes('10,001+ employees')
        ) {
          jobDetails.companyDetails.size = 'MASSIVE';
        }
      }

      // Alternative: try to determine size from LinkedIn employees count
      const linkedInMatch = companyInfoText.match(
        /(\d+(?:,\d+)*)\s+on\s+linkedin/
      );
      if (linkedInMatch) {
        const employeesCount = parseInt(linkedInMatch[1].replace(/,/g, ''));
        if (employeesCount > 5000) {
          jobDetails.companyDetails.size = 'MASSIVE';
        } else {
          const companySize = determineCompanySize(employeesCount);
          if (companySize) {
            jobDetails.companyDetails.size = companySize;
          }
        }
      }

      // Try to determine industry directly from the company info
      const industryElement = companyInfoSection.querySelector('.t-14');
      if (industryElement) {
        const industryText = industryElement.childNodes[0].textContent
          .trim()
          .toLowerCase();

        if (industryText.includes('consulting')) {
          jobDetails.companyDetails.industry = 'CONSULTING';
        } else if (
          industryText.includes('software') ||
          industryText.includes('technology')
        ) {
          jobDetails.companyDetails.industry = 'SOFTWARE';
        } else if (
          industryText.includes('finance') ||
          industryText.includes('banking')
        ) {
          jobDetails.companyDetails.industry = 'FINANCE';
        } else if (industryText.includes('healthcare')) {
          jobDetails.companyDetails.industry = 'HEALTHCARE';
        }
        // Add more industry mappings as needed
      }

      // Additionally check company info from description text
      const descriptionText = companyInfoText;
      if (
        descriptionText.includes('consulting') ||
        descriptionText.includes('professional services')
      ) {
        jobDetails.companyDetails.industry = 'CONSULTING';
      } else if (
        descriptionText.includes('non-profit') ||
        descriptionText.includes('nonprofit')
      ) {
        jobDetails.companyDetails.type = 'NON_PROFIT';
      } else if (descriptionText.includes('government')) {
        jobDetails.companyDetails.type = 'GOVERNMENT_AGENCY';
      }
    }

    console.info('LinkedIn parser completed successfully');
    return jobDetails;
  } catch (error) {
    console.error('Error in LinkedIn parser:', error);
    return defaultJobDetails;
  }
}

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

// Helper function to extract text from an element if it exists
function getTextFromElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

// Helper function to clean text (remove extra whitespace, etc.)
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// Helper function to extract a value using a regular expression
function extractWithRegex(text, regex, groupIndex = 1) {
  const match = text.match(regex);
  return match ? match[groupIndex] : '';
}

// Export the main function so it can be used in popup.js
window.detectJobDetails = detectJobDetails;
