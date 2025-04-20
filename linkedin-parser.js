async function linkedinParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));
  const domain = window.location.href;

  // Check if we're on a LinkedIn job page
  if (!domain.includes('jobs')) {
    console.log(domain);
    console.info('Not on a LinkedIn job posting page');
    return defaultJobDetails;
  }

  try {
    console.info('Parsing LinkedIn job posting');

    // Determine page type based on URL structure
    const url = window.location.href;
    const isDirectJobView = url.includes('/jobs/view/');
    const isJobSearchView = url.includes('currentJobId=');

    // Extract job ID based on page type
    let currentJobId = null;
    let activeJobElement = null;

    if (isDirectJobView) {
      console.info('Detected direct job view page');
      // Extract job ID from URL path like /jobs/view/4210893037/
      const jobIdMatch = url.match(/\/jobs\/view\/(\d+)/);
      currentJobId = jobIdMatch ? jobIdMatch[1] : null;
      console.info('Job ID from direct view:', currentJobId);

      // On direct view pages, the whole page is about the single job
      // No need to look for an active job element in a list
    } else if (isJobSearchView) {
      console.info('Detected job search view page');
      // Extract from URL parameter for search pages
      const currentJobIdMatch = url.match(/currentJobId=(\d+)/);
      currentJobId = currentJobIdMatch ? currentJobIdMatch[1] : null;
      console.info('Current job ID from search view:', currentJobId);

      // If we have a job ID, look for the currently active job in the results list
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
    }

    // Extract company name
    let companyName = '';
    // First try getting it from the detail view
    const companyDetailElement = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name a' // Updated to target the anchor tag for better consistency
    );
    if (companyDetailElement) {
      companyName = companyDetailElement.textContent.trim();
    }
    // If not found or if it's empty, try from the active job card (only relevant for search view)
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
    // First try from detail view - use the h1 inside the job title container
    const jobTitleElement = document.querySelector(
      '.job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title h1'
    );
    if (jobTitleElement) {
      jobTitle = jobTitleElement.textContent.trim();
    }
    // If not found, try from active job card (only relevant for search view)
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
    // Try detail view first - look specifically in the tertiary description container
    const locationElement = document.querySelector(
      '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text:first-child'
    );

    if (locationElement) {
      locationText = locationElement.textContent.trim();
    }

    // If not found, try the job card (only relevant for search view)
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
        // Extract city and work mode if present
        const cityAndMode = locationParts[0];
        const workModeMatch = cityAndMode.match(/\((.*?)\)$/);

        if (workModeMatch) {
          jobDetails.location.city = cityAndMode.replace(/\(.*\)$/, '').trim();
          const workModeText = workModeMatch[1].toUpperCase();

          if (workModeText === 'REMOTE') {
            jobDetails.jobDetails.workMode = 'REMOTE';
          } else if (workModeText === 'HYBRID') {
            jobDetails.jobDetails.workMode = 'HYBRID';
          } else if (workModeText === 'ON-SITE') {
            jobDetails.jobDetails.workMode = 'ONSITE';
          }
        } else {
          jobDetails.location.city = cityAndMode.trim();
        }
      }

      if (locationParts.length >= 2) {
        jobDetails.location.state = locationParts[1].trim();
      }

      if (locationParts.length >= 3) {
        jobDetails.location.country = locationParts[2].trim();
      }
    }

    // Extract work mode and type from pills or buttons
    const pillElements = document.querySelectorAll(
      '.job-details-preferences-and-skills__pill .ui-label, .job-details-fit-level-preferences button'
    );

    let salaryFound = false;
    pillElements.forEach((element) => {
      const pillText = element.textContent.trim();
      const upperPillText = pillText.toUpperCase();

      // Handle work mode
      if (upperPillText.includes('REMOTE')) {
        jobDetails.jobDetails.workMode = 'REMOTE';
      } else if (
        upperPillText.includes('ON-SITE') ||
        upperPillText.includes('ONSITE')
      ) {
        jobDetails.jobDetails.workMode = 'ONSITE';
      } else if (upperPillText.includes('HYBRID')) {
        jobDetails.jobDetails.workMode = 'HYBRID';
      }

      // Handle work type
      if (upperPillText.includes('FULL-TIME')) {
        jobDetails.jobDetails.workType = 'FULL_TIME';
      } else if (upperPillText.includes('PART-TIME')) {
        jobDetails.jobDetails.workType = 'PART_TIME';
      } else if (upperPillText.includes('CONTRACT')) {
        jobDetails.jobDetails.workType = 'CONTRACT';
      } else if (upperPillText.includes('TEMPORARY')) {
        jobDetails.jobDetails.workType = 'TEMPORARY';
      } else if (upperPillText.includes('INTERNSHIP')) {
        jobDetails.jobDetails.workType = 'INTERNSHIP';
      }

      // Handle salary information
      if (!salaryFound) {
        // Look for salary ranges like "$150K/yr - $200K/yr"
        const salaryRangePattern =
          /\$(\d+(?:,\d+)*(?:\.\d+)?)[K]?\/yr\s*-\s*\$(\d+(?:,\d+)*(?:\.\d+)?)[K]?\/yr/i;
        const salaryMatch = pillText.match(salaryRangePattern);

        if (salaryMatch) {
          let minSalary = salaryMatch[1].replace(/,/g, '');
          let maxSalary = salaryMatch[2].replace(/,/g, '');

          // Handle 'K' notation
          if (pillText.includes('K')) {
            minSalary = parseInt(minSalary) * 1000;
            maxSalary = parseInt(maxSalary) * 1000;
          } else {
            minSalary = parseInt(minSalary);
            maxSalary = parseInt(maxSalary);
          }

          if (!isNaN(minSalary) && !isNaN(maxSalary)) {
            salaryFound = true;
            jobDetails.compensation.salaryRangeMin = minSalary.toString();
            jobDetails.compensation.salaryRangeMax = maxSalary.toString();
            jobDetails.compensation.payFrequency = 'ANNUALLY';
            console.info(`Found salary range: $${minSalary} - $${maxSalary}`);
          }
        }

        // Also check for hourly rates
        const hourlyRatePattern =
          /\$(\d+(?:\.\d+)?)\s*\/\s*hr\s*-\s*\$(\d+(?:\.\d+)?)\s*\/\s*hr/i;
        const hourlyMatch = pillText.match(hourlyRatePattern);

        if (hourlyMatch) {
          const minSalary = parseFloat(hourlyMatch[1]);
          const maxSalary = parseFloat(hourlyMatch[2]);

          if (!isNaN(minSalary) && !isNaN(maxSalary)) {
            salaryFound = true;
            jobDetails.compensation.salaryRangeMin = minSalary.toString();
            jobDetails.compensation.salaryRangeMax = maxSalary.toString();
            jobDetails.compensation.payFrequency = 'HOURLY';
            console.info(
              `Found hourly rate: $${minSalary}/hr - $${maxSalary}/hr`
            );
          }
        }
      }
    });

    // Extract job description/notes
    const jobDescriptionElement = document.querySelector(
      '.jobs-description__content, .jobs-description-content__text'
    );
    if (jobDescriptionElement) {
      jobDetails.notes = jobDescriptionElement.textContent
        .trim()
        .replace(/\s+/g, ' ');
    }

    // Extract company LinkedIn URL
    const companyLinkElement = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name a'
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

    // Try to determine company size and type from the about section
    const companyInfoSection = document.querySelector('.jobs-company__box');
    if (companyInfoSection) {
      const companyInfoText = companyInfoSection.textContent.toLowerCase();

      // Try to get company size from "X employees" text
      const employeesMatch = companyInfoText.match(
        /(\d+(?:-\d+)?)\s*employees/
      );
      if (employeesMatch) {
        const employeesText = employeesMatch[1];
        // If it's a range like "11-50", use the upper bound
        let employeesCount;
        if (employeesText.includes('-')) {
          const [min, max] = employeesText.split('-').map(Number);
          employeesCount = max;
        } else {
          employeesCount = parseInt(employeesText);
        }

        const companySize = determineCompanySize(employeesCount);
        if (companySize) {
          jobDetails.companyDetails.size = companySize;
        }
      }

      // Try to determine industry
      const industryElement = companyInfoSection.querySelector('.t-14');
      if (industryElement) {
        const industryText = industryElement.childNodes[0].textContent.trim();

        // Map common LinkedIn industry names to your enum values
        if (industryText.toLowerCase().includes('consulting')) {
          jobDetails.companyDetails.industry = 'CONSULTING';
        } else if (industryText.toLowerCase().includes('software')) {
          jobDetails.companyDetails.industry = 'SOFTWARE';
        } else if (industryText.toLowerCase().includes('technology')) {
          jobDetails.companyDetails.industry = 'TECHNOLOGY';
        } else if (industryText.toLowerCase().includes('finance')) {
          jobDetails.companyDetails.industry = 'FINANCE';
        } else if (industryText.toLowerCase().includes('healthcare')) {
          jobDetails.companyDetails.industry = 'HEALTHCARE';
        } else if (industryText.toLowerCase().includes('manufacturing')) {
          jobDetails.companyDetails.industry = 'MANUFACTURING';
        } else if (
          industryText.toLowerCase().includes('defense') ||
          industryText.toLowerCase().includes('aerospace')
        ) {
          jobDetails.companyDetails.industry = 'DEFENSE'; // Using closest match from your enum
        }
        // Add more industry mappings as needed
      }

      // YOUR ORIGINAL COMPANY TYPE DETECTION LOGIC
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
