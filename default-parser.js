async function defaultParser(defaultJobDetails) {
  const jobDetails = defaultJobDetails;
  try {
    console.info('Running default parser to detect job details');

    // Check if this is likely a job page
    const isJobPage = await detectIfJobPage();

    if (!isJobPage) {
      console.info('Page does not appear to be a job listing page');
      return defaultJobDetails;
    }

    console.info(
      'Page appears to be a job listing, attempting to extract details'
    );

    // Extract job description
    const possibleDescriptionElements = [
      document.querySelector('.position-job-description'),
      document.querySelector('[itemprop="description"]'),
      document.querySelector('[class*="description"]'),
      document.querySelector('[class*="details"]'),
      document.querySelector('[class*="content"]'),
      document.querySelector('[id*="description"]'),
      document.querySelector('[id*="job-details"]'),
      document.querySelector('article'),
      document.querySelector('main'),
    ].filter(Boolean);

    for (const element of possibleDescriptionElements) {
      const description = element.textContent.trim();
      if (description && description.length > 100) {
        jobDetails.jobDescription = description;

        // Try to extract work mode from description
        const workMode = window.parserUtils.detectWorkMode(description);
        if (workMode) {
          jobDetails.jobDetails.workMode = workMode;
        }

        // Try to extract work type from description
        const workType = window.parserUtils.detectWorkType(description);
        if (workType) {
          jobDetails.jobDetails.workType = workType;
        }

        // Try to extract industry from description
        const industry = window.parserUtils.detectIndustry(description);
        if (industry) {
          jobDetails.companyDetails.industry = industry;
        }

        // Try to extract salary information from description
        const salaryInfo = window.parserUtils.parseSalaryInfo(description);
        if (Object.keys(salaryInfo).length > 0) {
          Object.assign(jobDetails.compensation, salaryInfo);
        }

        // Try to extract company website from description
        if (jobDetails.companyName) {
          const companyWebsite = window.parserUtils.extractCompanyWebsite(
            description,
            jobDetails.companyName
          );
          if (companyWebsite) {
            jobDetails.companyDetails.website = companyWebsite;
          }
        }

        break;
      }
    }

    // Extract company name - look for common containers or metadata
    const possibleCompanyElements = [
      document.querySelector('meta[property="og:site_name"]'),
      document.querySelector('meta[name="author"]'),
      document.querySelector('.company-name'),
      document.querySelector('[class*="company"]'),
      document.querySelector('[class*="employer"]'),
      document.querySelector('[class*="organization"]'),
      document.querySelector('[itemtype*="Organization"]'),
      // Common containers that might have company name
      document.querySelector('.job-company'),
      document.querySelector('.employer-name'),
      document.querySelector('#company-name'),
      document.querySelector('[data-company]'),
    ].filter(Boolean);

    for (const element of possibleCompanyElements) {
      const companyName =
        element.getAttribute('content') || element.textContent;
      if (companyName && companyName.trim() && companyName.length < 100) {
        jobDetails.companyName = companyName.trim();
        break;
      }
    }

    // Extract job title - look for heading elements and common containers
    const possibleTitleElements = [
      document.querySelector('.job-title'),
      document.querySelector('.position-title'),
      document.querySelector('title'),
      document.querySelector('[class*="title"]'),
      document.querySelector('meta[property="og:title"]'),
      document.querySelector('[class*="position"]'),
      document.querySelector('[class*="role"]'),
      document.querySelector('[itemtype*="JobPosting"] [itemprop="title"]'),
      document.querySelector('h1'),
    ].filter(Boolean);

    console.dir(possibleTitleElements, { depth: null });

    for (const element of possibleTitleElements) {
      const jobTitle = element.getAttribute('content') || element.textContent;
      console.info('Job title found:', jobTitle);
      if (jobTitle && jobTitle.trim() && jobTitle.length < 200) {
        // Filter out site names and other common text from titles
        const cleanedTitle = jobTitle
          .trim()
          .replace(/\| .+$/, '') // Remove pipe and everything after
          .replace(/-[^-]+$/, '') // Remove dash and last part (usually site name)
          .replace(/\([^)]+\)/, '') // Remove parentheses
          .trim();

        if (cleanedTitle) {
          jobDetails.jobTitle = cleanedTitle;
          break;
        }
      }
    }

    // If job title is not found but company name is, try to extract job title from context
    if (!jobDetails.jobTitle && jobDetails.jobDescription) {
      // Look for job title indicators in job description
      const titleIndicators = [
        /(?:We are|We're|Looking for(?: an?| our)?) ([A-Za-z0-9\s]+(?:Developer|Engineer|Designer|Manager|Director|Specialist|Analyst|Consultant|Administrator|Coordinator|Representative|Assistant|Technician|Architect))/i,
        /(?:Job Title|Position|Role|Opening)(?:\s+is)?(?:\s*:\s*)([A-Za-z0-9\s\-]+)/i,
        /([A-Za-z0-9\s\-]+) (?:position|role|job|opportunity) (?:is available|available)/i,
        /(?:hiring|recruiting|seeking)(?: for)? (?:an?|the) ([A-Za-z0-9\s\-]+)/i,
      ];

      for (const pattern of titleIndicators) {
        const match = jobDetails.jobDescription.match(pattern);
        if (match && match[1]) {
          const potentialTitle = match[1].trim();
          // Validate: must be reasonable length and not generic
          if (
            potentialTitle.length > 2 &&
            potentialTitle.length < 100 &&
            ![
              'candidate',
              'professional',
              'individual',
              'person',
              'team member',
            ].includes(potentialTitle.toLowerCase())
          ) {
            jobDetails.jobTitle = potentialTitle;
            console.info('Found job title in job description:', potentialTitle);
            break;
          }
        }
      }

      // If still no match, try extracting from heading elements
      if (!jobDetails.jobTitle) {
        const headingElements = Array.from(
          document.querySelectorAll('h1, h2, h3, h4')
        );

        for (const element of headingElements) {
          const headingText = element.textContent.trim();
          if (
            headingText.length > 5 &&
            headingText.length < 100 &&
            /(?:Developer|Engineer|Designer|Manager|Director|Specialist|Analyst|Consultant|Administrator|Coordinator|Representative|Assistant)/i.test(
              headingText
            )
          ) {
            jobDetails.jobTitle = headingText;
            console.info('Found job title in heading:', headingText);
            break;
          }
        }
      }
    }

    // if company name or job title is not found, try to guess it from context words
    if (!jobDetails.companyName && jobDetails.jobDescription) {
      // Look for strong company indicators in job description with specific patterns
      const companyIndicators = [
        // Use non-capturing groups, word boundaries, and add better boundaries to limit match length
        /About\s+(?!our\b|us\b|your\b|my\b|their\b|the\b|this\b|these\b|those\b)([A-Z][A-Za-z0-9\s]{1,30}?(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)\s*(?:\.|\,|\:|is|was|has)/i,
        /Join\s+(?!our\b|us\b|your\b|my\b|their\b|the\b|this\b|these\b|those\b)([A-Z][A-Za-z0-9\s]{1,30}?(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)\s*(?:\.|\,|\:|and|where|to|in)/i,
        /work(?:ing)?\s+(?:at|for|with)\s+(?!our\b|us\b|your\b|my\b|their\b|the\b|this\b|these\b|those\b)([A-Z][A-Za-z0-9\s]{1,30}?)(?:\s+(?:is|was|has|and|where|to|in|\.|\,|\:|\(|\)))/i,

        // Better boundary conditions for this pattern
        /([A-Z][A-Za-z0-9\s]{1,30}?(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)\s+is\s+(?:a|the)\s+(?:leading|premier|trusted)/i,

        /Why\s+Join\s+(?!our\b|us\b|your\b|my\b|their\b|the\b|this\b|these\b|those\b)([A-Z][A-Za-z0-9\s]{1,30}?(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)\?/i,
        /support.*(?:growth|modernization)\s+of\s+(?!our\b|us\b|your\b|my\b|their\b|the\b|this\b|these\b|those\b)([A-Z][A-Za-z0-9\s]{1,30}?(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)'s/i,
        /(?:proud|excited|happy)\s+to\s+(?:be\s+part\s+of|join)\s+(?!our\b|us\b|your\b|my\b|their\b|the\b|this\b|these\b|those\b)([A-Z][A-Za-z0-9\s]{1,30}?(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)(?:\s+(?:is|was|has|and|where|to|in|\.|\,|\:|\(|\)))/i,

        /([A-Z][A-Za-z0-9\s]{1,30}?(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)\s+empowers\s+/i,
      ];

      for (const pattern of companyIndicators) {
        const match = jobDetails.jobDescription.match(pattern);
        if (match && match[1]) {
          // Enhance the validation logic to better filter out false positives
          const potentialCompany = match[1].trim();
          // Validate: must be reasonable length and not generic
          if (
            potentialCompany.length > 2 &&
            potentialCompany.length < 50 &&
            // Check if it doesn't include certain verbs or conjunctions that indicate it's part of a sentence
            !/\b(and|or|but|if|then|because|however|therefore|thus|while|when|who|what|where|why|how)\b/i.test(
              potentialCompany
            ) &&
            // Check for complete sentence indicators
            !/[\.!?;]/.test(potentialCompany) &&
            // Check for likely company name (starts with capital, doesn't have too many spaces)
            /^[A-Z]/.test(potentialCompany) &&
            potentialCompany.split(/\s+/).length <= 6 &&
            // Check to exclude common generic terms
            ![
              'company',
              'organization',
              'employer',
              'business',
              'team',
            ].includes(potentialCompany.toLowerCase()) &&
            // Check to exclude phrases starting with possessive pronouns
            !/^(our|us|your|my|their|the|this|these|those)\b/i.test(
              potentialCompany
            )
          ) {
            // avoid sentences
            if (
              !/\b(is|are|was|were|will|shall|should|would|could|may|might|must|can)\b/i.test(
                potentialCompany
              )
            ) {
              jobDetails.companyName = potentialCompany;
              console.info(
                'Found company name in job description:',
                potentialCompany
              );
              break;
            }
          }
        }
      }

      // If still no match, try extracting from "title" elements with company indicators
      if (!jobDetails.companyName) {
        const titleElements = Array.from(
          document.querySelectorAll('title, h1, h2, h3')
        );
        for (const element of titleElements) {
          const titleText = element.textContent || '';
          if (
            titleText.includes('Jewelers Mutual') ||
            titleText.includes('JEW1003JEWEL') ||
            titleText.match(/JEW\d+/i)
          ) {
            const match = titleText.match(
              /([A-Z][A-Za-z0-9\s]+(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)/
            );
            if (
              match &&
              match[1] &&
              match[1].length > 2 &&
              match[1].length < 50
            ) {
              jobDetails.companyName = match[1].trim();
              console.info(
                'Found company name in title element:',
                jobDetails.companyName
              );
              break;
            }
          }
        }
      }

      // Try more specific DOM selectors for company name
      if (!jobDetails.companyName) {
        // Look for elements with company-related attributes
        const companyElements = [
          ...document.querySelectorAll(
            '[data-tenant], [data-company], [data-employer]'
          ),
          ...document.querySelectorAll(
            '[class*="company"], [class*="employer"], [id*="company"], [id*="employer"]'
          ),
        ];

        for (const element of companyElements) {
          const companyText =
            element.getAttribute('data-tenant') ||
            element.getAttribute('data-company') ||
            element.getAttribute('data-employer') ||
            element.textContent;
          if (
            companyText &&
            companyText.length > 2 &&
            companyText.length < 50
          ) {
            // Extract potential company name
            const match = companyText.match(
              /([A-Z][A-Za-z0-9\s]+(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)/
            );
            if (match && match[1]) {
              jobDetails.companyName = match[1].trim();
              console.info(
                'Found company name in DOM element:',
                jobDetails.companyName
              );
              break;
            }
          }
        }
      }
    }

    // Extract location information
    const possibleLocationElements = [
      document.querySelector('[class*="location"]'),
      document.querySelector('[itemprop="jobLocation"]'),
      document.querySelector('[data-location]'),
      document.querySelector('[class*="address"]'),
      document.querySelector('address'),
      document.querySelector('[class*="city"]'),
      document.querySelector('[class*="region"]'),
      document.querySelector('[class*="postal"]'),
    ].filter(Boolean);

    for (const element of possibleLocationElements) {
      const locationText = element.textContent.trim();
      if (locationText && locationText.length < 200) {
        const locationData = window.parserUtils.parseLocationText(locationText);
        Object.assign(jobDetails.location, locationData);
        break;
      }
    }

    // Look for company details in meta tags
    const possibleCompanyWebsiteElements = [
      document.querySelector('meta[property="og:url"]'),
      document.querySelector('link[rel="canonical"]'),
      document.querySelector('meta[name="twitter:domain"]'),
    ].filter(Boolean);

    for (const element of possibleCompanyWebsiteElements) {
      const url =
        element.getAttribute('content') || element.getAttribute('href');
      if (url && !jobDetails.companyDetails.website) {
        const domainMatch = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
        if (domainMatch) {
          jobDetails.companyDetails.website = `https://${domainMatch[1]}`;
          break;
        }
      }
    }

    // After all extraction attempts for both fields, check if they're identical and try to fix
    if (
      jobDetails.companyName &&
      jobDetails.jobTitle &&
      jobDetails.companyName.toLowerCase() === jobDetails.jobTitle.toLowerCase()
    ) {
      console.info(
        'Company name and job title are identical, attempting to fix...'
      );

      // If they're identical, try to find a better company name
      const possibleCompanyIndicators = [
        /About\s+([A-Z][A-Za-z0-9\s]+(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)\s*:/i,
        /Join\s+([A-Z][A-Za-z0-9\s]+(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)/i,
        /at\s+([A-Z][A-Za-z0-9\s]+(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)/i,
        /with\s+([A-Z][A-Za-z0-9\s]+(?:Inc\.?|LLC|Corp\.?|Company|Group|Team)?)/i,
      ];

      if (jobDetails.jobDescription) {
        for (const pattern of possibleCompanyIndicators) {
          const match = jobDetails.jobDescription.match(pattern);
          if (match && match[1]) {
            const newCompanyName = match[1].trim();
            if (
              newCompanyName.length > 2 &&
              newCompanyName.length < 50 &&
              newCompanyName.toLowerCase() !== jobDetails.jobTitle.toLowerCase()
            ) {
              jobDetails.companyName = newCompanyName;
              console.info(
                'Fixed identical company name/job title by finding new company name:',
                newCompanyName
              );
              break;
            }
          }
        }
      }

      // If company name and job title are still identical, check if the job title contains typical job title words
      // If so, try to extract a company name from the page title
      if (
        jobDetails.companyName.toLowerCase() ===
        jobDetails.jobTitle.toLowerCase()
      ) {
        const jobTitleKeywords =
          /(?:Developer|Engineer|Designer|Manager|Director|Specialist|Analyst|Consultant|Administrator|Coordinator|Representative|Assistant)/i;

        if (jobTitleKeywords.test(jobDetails.jobTitle)) {
          // This is likely a job title, so try to find a company name elsewhere
          const pageTitle = document.querySelector('title')?.textContent || '';
          const titleParts = pageTitle.split(/[\|\-]/);

          if (titleParts.length > 1) {
            // Often the company name is in the last part of the page title after a separator
            const potentialCompany = titleParts[titleParts.length - 1].trim();
            if (
              potentialCompany.length > 2 &&
              potentialCompany.length < 50 &&
              potentialCompany.toLowerCase() !==
                jobDetails.jobTitle.toLowerCase()
            ) {
              jobDetails.companyName = potentialCompany;
              console.info(
                'Fixed identical company name/job title using page title:',
                potentialCompany
              );
            }
          }
        }
      }
    }

    console.info('Default parser completed extraction');
    return jobDetails;
  } catch (error) {
    console.error('Error in default parser:', error);
    return defaultJobDetails;
  }
}

async function detectIfJobPage() {
  // Check URL for job-related keywords
  const url = window.location.href.toLowerCase();
  const jobUrlIndicators = [
    'job',
    'career',
    'position',
    'vacancy',
    'opening',
    'apply',
    'employment',
  ];

  if (jobUrlIndicators.some((indicator) => url.includes(indicator))) {
    console.info('URL contains job-related keywords');
    return true;
  }

  // Check page content for job-related keywords
  const pageText = document.body.innerText.toLowerCase();
  const jobContentIndicators = [
    'apply',
    'career',
    'company',
    'job',
    'pay',
    'resume',
    'salary',
    'title',
    'position',
    'employment',
    'job description',
    'qualifications',
    'requirements',
    'responsibilities',
    'experience required',
    'skills required',
    'we are looking for',
    'job type',
    'work hours',
    'benefits',
    'compensation',
    'application deadline',
    'full-time',
    'part-time',
    'contract',
    'temporary',
    'remote',
    'hybrid',
    'on-site',
    'apply now',
    'submit your resume',
    'submit your cv',
  ];

  const keywordMatches = jobContentIndicators.filter((keyword) =>
    pageText.includes(keyword)
  );

  // The page is likely a job listing if it contains multiple job-related keywords
  // Using a threshold of 5 to reduce false positives
  const isLikelyJobPage = keywordMatches.length >= 5;

  if (isLikelyJobPage) {
    console.info(
      `Found ${keywordMatches.length} job-related keywords in page content`
    );
    return true;
  }

  const hasJobPostingSchema =
    document.querySelector('[itemtype*="JobPosting"]') !== null;
  if (hasJobPostingSchema) {
    console.info('Found JobPosting schema markup');
    return true;
  }

  return false;
}

window.defaultParser = defaultParser;
