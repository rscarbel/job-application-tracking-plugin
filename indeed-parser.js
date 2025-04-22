async function indeedParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));
  const domain = window.location.href.toLowerCase();

  if (
    !domain.includes('indeed.com') ||
    !(domain.includes('vjk=') || domain.includes('viewjob'))
  ) {
    console.info('Not on an Indeed job posting page');
    return defaultJobDetails;
  }

  try {
    console.info('Parsing Indeed job posting');

    const jobIdMatch = domain.match(/vjk=([a-zA-Z0-9]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;
    console.info('Job ID:', jobId);

    let companyElement = document.querySelector(
      '.jobsearch-JobInfoHeader-companyNameSimple, ' +
        '.jobsearch-JobInfoHeader-companyNameLink'
    );

    // If company name is in an anchor tag, get the text content
    if (companyElement) {
      jobDetails.companyName = companyElement.textContent.trim();
      // Remove any trailing SVG icons or extra text
      jobDetails.companyName = jobDetails.companyName
        .split('\n')[0]
        .split('\t')[0];
    }

    const jobTitleElement = document.querySelector(
      'h2[data-testid="simpler-jobTitle"]'
    );
    if (jobTitleElement) {
      jobDetails.jobTitle = jobTitleElement.textContent.trim();
    }

    const locationElement = document.querySelector(
      '[data-testid="jobsearch-JobInfoHeader-companyLocation"]'
    );

    if (locationElement) {
      // First try the .css-1w32fcv container format
      const locationContainer = locationElement.querySelector('.css-1w32fcv');

      if (locationContainer) {
        // Extract location from the city/state/zip element
        const cityStateZipElement =
          locationContainer.querySelector('.css-xb6x8x');
        if (cityStateZipElement) {
          // Clean up the location text by removing nested elements and extra spaces
          const locationTextNode = cityStateZipElement.firstChild;
          if (
            locationTextNode &&
            locationTextNode.nodeType === Node.TEXT_NODE
          ) {
            const locationText = locationTextNode.textContent.trim();
            const locationData =
              window.parserUtils.parseLocationText(locationText);
            jobDetails.location.city = locationData.city;
            jobDetails.location.state = locationData.state;
            jobDetails.location.postalCode = locationData.postalCode;
            jobDetails.location.country = locationData.country;
          }
        }

        // Extract work mode from the separate text node (e.g., "Hybrid work")
        const workModeNode = Array.from(locationContainer.childNodes).find(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
        );

        if (workModeNode) {
          const workModeText = workModeNode.textContent.trim();
          jobDetails.jobDetails.workMode =
            window.parserUtils.detectWorkMode(workModeText);
        }
      } else {
        // Try direct format (e.g., "Chapel Hill, NC")
        const locationTextElement =
          locationElement.querySelector('.css-xb6x8x');
        if (locationTextElement) {
          const locationText = locationTextElement.textContent.trim();
          const locationData =
            window.parserUtils.parseLocationText(locationText);
          jobDetails.location.city = locationData.city;
          jobDetails.location.state = locationData.state;
          jobDetails.location.postalCode = locationData.postalCode;
          jobDetails.location.country = locationData.country;
        }
      }
    }

    let salaryInfo = {};

    const payButton = document.querySelector(
      'button[data-testid^="$"][data-testid$="-tile"]'
    );

    if (payButton) {
      const salaryText = payButton
        .getAttribute('data-testid')
        .split('-tile')[0];
      if (salaryText.includes('$')) {
        salaryInfo = window.parserUtils.parseSalaryInfo(salaryText);
        if (Object.keys(salaryInfo).length > 0) {
          // Apply all salary properties to the jobDetails
          Object.assign(jobDetails.compensation, salaryInfo);
        }
      }
    }

    // If not found in buttons, look for salary info in the job description
    if (Object.keys(salaryInfo).length === 0) {
      const jobDescriptionElement =
        document.getElementById('jobDescriptionText');
      if (jobDescriptionElement) {
        const descriptionText = jobDescriptionElement.textContent;
        salaryInfo = window.parserUtils.parseSalaryInfo(descriptionText);
        if (Object.keys(salaryInfo).length > 0) {
          // Apply all salary properties to the jobDetails
          Object.assign(jobDetails.compensation, salaryInfo);
        }
      }
    }

    const fullTimeButton = document.querySelector(
      'button[data-testid="Full-time-tile"]'
    );
    if (fullTimeButton) {
      const workTypeText = fullTimeButton
        .getAttribute('data-testid')
        .replace('-tile', '');

      jobDetails.jobDetails.workType =
        window.parserUtils.detectWorkType(workTypeText);
    }

    const jobDescriptionElement = document.getElementById('jobDescriptionText');
    if (jobDescriptionElement) {
      const jobDescriptionText = jobDescriptionElement.innerText
        .trim()
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+/gm, '');

      jobDetails.jobDescription = jobDescriptionText;

      if (jobDetails.companyName) {
        const companyWebsite = window.parserUtils.extractCompanyWebsite(
          jobDescriptionText,
          jobDetails.companyName
        );

        if (companyWebsite) {
          jobDetails.companyDetails.website = companyWebsite;
        }
      }

      const industry = window.parserUtils.detectIndustry(jobDescriptionText);
      if (industry) {
        jobDetails.companyDetails.industry = industry;
      }
    }

    console.info('Indeed parser completed successfully');
    return jobDetails;
  } catch (error) {
    console.error('Error in Indeed parser:', error);
    return defaultJobDetails;
  }
}

window.indeedParser = indeedParser;
