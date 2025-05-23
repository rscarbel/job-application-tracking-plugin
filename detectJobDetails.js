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
      },
      source: domain,
      jobDescription: '',
    };

    const parser = getParserForDomain(domain);

    if (!parser) {
      console.warn(`No parser found for domain: ${domain}`);
      return null;
    }

    const jobDetails = await parser(defaultJobDetails);

    console.info('Job details detected:', jobDetails);

    return jobDetails;
  } catch (error) {
    console.error('Error detecting job details:', error);
    return null;
  }
}

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
  return window.defaultParser ?? null;
}

async function glassdoorParser(jobDetails) {
  // TODO: remove the call to the default after implementing this
  window.defaultParser(jobDetails);

  try {
    // TODO: Implement Glassdoor-specific parsing logic
    console.info('Glassdoor parser not yet implemented');
  } catch (error) {
    console.error('Error in Glassdoor parser:', error);
    return jobDetails;
  }
}

async function monsterParser(jobDetails) {
  // TODO: remove the call to the default after implementing this
  window.defaultParser(jobDetails);

  try {
    // TODO: Implement Monster-specific parsing logic
    console.info('Monster parser not yet implemented');
  } catch (error) {
    console.error('Error in Monster parser:', error);
    return jobDetails;
  }
}

async function zipRecruiterParser(jobDetails) {
  // TODO: remove the call to the default after implementing this
  window.defaultParser(jobDetails);

  try {
    // TODO: Implement ZipRecruiter-specific parsing logic
    console.info('ZipRecruiter parser not yet implemented');
  } catch (error) {
    console.error('Error in ZipRecruiter parser:', error);
    return jobDetails;
  }
}

async function diceParser(jobDetails) {
  // TODO: remove the call to the default after implementing this
  window.defaultParser(jobDetails);

  try {
    // TODO: Implement Dice-specific parsing logic
    console.info('Dice parser not yet implemented');
  } catch (error) {
    console.error('Error in Dice parser:', error);
    return jobDetails;
  }
}

async function wellfoundParser(jobDetails) {
  // TODO: remove the call to the default after implementing this
  window.defaultParser(jobDetails);

  try {
    // TODO: Implement Wellfound (formerly AngelList)-specific parsing logic
    console.info('Wellfound parser not yet implemented');
  } catch (error) {
    console.error('Error in Wellfound parser:', error);
    return jobDetails;
  }
}

async function simplyHiredParser(jobDetails) {
  // TODO: remove the call to the default after implementing this
  window.defaultParser(jobDetails);

  try {
    // TODO: Implement SimplyHired-specific parsing logic
    console.info('SimplyHired parser not yet implemented');
  } catch (error) {
    console.error('Error in SimplyHired parser:', error);
    return jobDetails;
  }
}

window.detectJobDetails = detectJobDetails;
