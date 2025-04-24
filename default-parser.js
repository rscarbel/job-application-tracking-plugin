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
      document.querySelector('h1'),
      document.querySelector('meta[property="og:title"]'),
      document.querySelector('title'),
      document.querySelector('.job-title'),
      document.querySelector('[class*="title"]'),
      document.querySelector('[class*="position"]'),
      document.querySelector('[class*="role"]'),
      document.querySelector('[itemtype*="JobPosting"] [itemprop="title"]'),
    ].filter(Boolean);

    for (const element of possibleTitleElements) {
      const jobTitle = element.getAttribute('content') || element.textContent;
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

    // Extract job description
    const possibleDescriptionElements = [
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

  // Check for schema.org JobPosting structured data
  const hasJobPostingSchema =
    document.querySelector('[itemtype*="JobPosting"]') !== null;
  if (hasJobPostingSchema) {
    console.info('Found JobPosting schema markup');
    return true;
  }

  return false;
}

window.defaultParser = defaultParser;
