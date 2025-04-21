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
      jobDescription: '',
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

async function glassdoorParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));

  try {
    // TODO: Implement Glassdoor-specific parsing logic
    console.info('Glassdoor parser not yet implemented');
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
    // Fall back to generic parser for now
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
    // Fall back to generic parser for now
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
    // Fall back to generic parser for now
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
    // Fall back to generic parser for now
  } catch (error) {
    console.error('Error in SimplyHired parser:', error);
    return jobDetails;
  }
}

// Export the main function so it can be used in popup.js
window.detectJobDetails = detectJobDetails;
