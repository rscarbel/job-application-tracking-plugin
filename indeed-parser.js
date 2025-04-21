async function indeedParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));
  const domain = window.location.href.toLowerCase();

  // Check if we're on an Indeed job page
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

    // Extract location - need to handle different location formats
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
            parseLocationText(locationText, jobDetails);
          }
        }

        // Extract work mode from the separate text node (e.g., "Hybrid work")
        const workModeNode = Array.from(locationContainer.childNodes).find(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
        );

        if (workModeNode) {
          const workModeText = workModeNode.textContent.trim().toLowerCase();
          detectWorkMode(workModeText, jobDetails);
        }
      } else {
        // Try direct format (e.g., "Chapel Hill, NC")
        const locationTextElement =
          locationElement.querySelector('.css-xb6x8x');
        if (locationTextElement) {
          const locationText = locationTextElement.textContent.trim();
          parseLocationText(locationText, jobDetails);
        }
      }
    }

    // Helper function to parse location text
    function parseLocationText(locationText, jobDetails) {
      if (!locationText) return;

      // Handle formats like "Durham, NC 27713" or "Chapel Hill, NC"
      const locationMatch = locationText.match(
        /^([^,]+),\s*([A-Z]{2})\s*(\d{5})?/
      );
      if (locationMatch) {
        jobDetails.location.city = locationMatch[1].trim();
        jobDetails.location.state = locationMatch[2].trim();
        if (locationMatch[3]) {
          jobDetails.location.postalCode = locationMatch[3].trim();
        }
      } else {
        // Fallback: use simple split if no pattern matches
        const locationParts = locationText.split(/,\s*/);
        if (locationParts.length >= 1) {
          jobDetails.location.city = locationParts[0].trim();
        }
        if (locationParts.length >= 2) {
          jobDetails.location.state = locationParts[1].trim();
        }
      }
    }

    // Helper function to detect work mode
    function detectWorkMode(text, jobDetails) {
      if (text.includes('hybrid')) {
        jobDetails.jobDetails.workMode = 'HYBRID';
      } else if (text.includes('remote')) {
        jobDetails.jobDetails.workMode = 'REMOTE';
      } else if (text.includes('on-site') || text.includes('onsite')) {
        jobDetails.jobDetails.workMode = 'ONSITE';
      }
    }

    // First try to extract salary from the Pay section in Profile insights
    const payButton = document.querySelector(
      'button[data-testid^="$"][data-testid$="-tile"]'
    );
    const salaryText = payButton
      ? payButton.getAttribute('data-testid').split('-tile')[0]
      : '';

    if (salaryText.includes('$')) {
      extractSalaryInfo(salaryText, jobDetails);
    } else {
      // If not found in buttons, look for salary info in the job description
      const jobDescriptionElement =
        document.getElementById('jobDescriptionText');
      if (jobDescriptionElement) {
        const descriptionText = jobDescriptionElement.textContent;

        // Look for salary patterns in the description
        const salaryPatterns = [
          /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:-|to|–)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:\/(?:yr|year|month|mo|week|wk|hour|hr|annually))?/i,
          /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:\/(?:yr|year|month|mo|week|wk|hour|hr|annually))?/i,
          /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:per|\/)\s*(?:hour|hr|month|mo|year|yr|week|wk|annually)/i,
          /(?:compensation|salary|pay):\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:-|to|–)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?/i,
        ];

        for (const pattern of salaryPatterns) {
          const salaryMatch = descriptionText.match(pattern);
          if (salaryMatch) {
            extractSalaryInfo(salaryMatch[0], jobDetails);
            break;
          }
        }
      }
    }

    // Helper function to extract salary information
    function extractSalaryInfo(salaryText, jobDetails) {
      // Parse salary ranges (e.g., "$150,000-175,000", "$150k to $175k")
      const rangePattern =
        /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:-|to|–)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?/i;
      const rangeMatch = salaryText.match(rangePattern);

      if (rangeMatch) {
        let minSalary = parseFloat(rangeMatch[1].replace(/,/g, ''));
        let maxSalary = parseFloat(rangeMatch[2].replace(/,/g, ''));

        // Handle 'k' notation
        if (salaryText.toLowerCase().includes(rangeMatch[1] + 'k')) {
          minSalary *= 1000;
        }
        if (salaryText.toLowerCase().includes(rangeMatch[2] + 'k')) {
          maxSalary *= 1000;
        }

        jobDetails.compensation.salaryRangeMin = minSalary.toString();
        jobDetails.compensation.salaryRangeMax = maxSalary.toString();
      } else {
        // Parse single values (e.g., "$18/hr", "$125k/year", "$50,000.00")
        const singlePattern =
          /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:\/|per)?\s*(hour|hr|yr|year|annually|month|mo|week|wk|day)?/i;
        const singleMatch = salaryText.match(singlePattern);

        if (singleMatch) {
          let salary = parseFloat(singleMatch[1].replace(/,/g, ''));

          // Handle 'k' notation
          if (salaryText.toLowerCase().includes(singleMatch[1] + 'k')) {
            salary *= 1000;
          }

          jobDetails.compensation.payAmount = salary.toString();
        }
      }

      // Detect pay frequency
      const frequencyPattern =
        /(hour|hr|yr|year|annually|month|mo|week|wk|day)/i;
      const frequencyMatch = salaryText.match(frequencyPattern);

      if (frequencyMatch) {
        const frequency = frequencyMatch[1].toLowerCase();
        if (frequency.includes('hour') || frequency.includes('hr')) {
          jobDetails.compensation.payFrequency = 'HOURLY';
        } else if (frequency.includes('month') || frequency === 'mo') {
          jobDetails.compensation.payFrequency = 'MONTHLY';
        } else if (frequency.includes('week') || frequency === 'wk') {
          jobDetails.compensation.payFrequency = 'WEEKLY';
        } else {
          jobDetails.compensation.payFrequency = 'ANNUALLY';
        }
      } else {
        // Default to annual if no frequency specified
        jobDetails.compensation.payFrequency = 'ANNUALLY';
      }
    }

    // Extract work type from the Job type section in Profile insights
    const fullTimeButton = document.querySelector(
      'button[data-testid="Full-time-tile"]'
    );
    if (fullTimeButton) {
      const workTypeText = fullTimeButton
        .getAttribute('data-testid')
        .replace('-tile', '')
        .toLowerCase();

      if (workTypeText === 'full-time') {
        jobDetails.jobDetails.workType = 'FULL_TIME';
      } else if (workTypeText === 'part-time') {
        jobDetails.jobDetails.workType = 'PART_TIME';
      } else if (workTypeText === 'contract') {
        jobDetails.jobDetails.workType = 'CONTRACT';
      } else if (workTypeText === 'temporary') {
        jobDetails.jobDetails.workType = 'TEMPORARY';
      } else if (workTypeText === 'internship') {
        jobDetails.jobDetails.workType = 'INTERNSHIP';
      }
    }

    // Get the job description next
    const jobDescriptionText = getJobDescription();

    function getJobDescription() {
      const jobDescriptionElement =
        document.getElementById('jobDescriptionText');
      if (jobDescriptionElement) {
        jobDetails.jobDescription = jobDescriptionElement.innerText
          .trim()
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s+/gm, '');
        return jobDescriptionElement.textContent;
      }
      return '';
    }

    const websitePattern =
      /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
    const websiteMatches = [...jobDescriptionText.matchAll(websitePattern)];

    if (websiteMatches.length > 0) {
      const companyName = jobDetails.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      const companyWebsite = websiteMatches.find((match) => {
        const fullUrl = match[0];
        const lowerUrl = fullUrl.toLowerCase();

        if (lowerUrl.includes(companyName)) {
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
        jobDetails.companyDetails.website = websiteUrl.startsWith('http')
          ? websiteUrl
          : `https://${websiteUrl}`;
      }
    }
    const industryKeywords = {
      HEALTHCARE: [
        'healthcare',
        'medical',
        'hospital',
        'health',
        'HIPAA',
        'clinical',
        'patient',
      ],
      TECHNOLOGY: [
        'technology',
        'tech',
        'software',
        'IT',
        'cloud',
        'digital',
        'SaaS',
      ],
      FINANCE: [
        'finance',
        'financial',
        'banking',
        'investment',
        'accounting',
        'insurance',
      ],
      CONSULTING: [
        'consulting',
        'advisory',
        'professional services',
        'consultancy',
      ],
      SOFTWARE: [
        'software',
        'development',
        'programming',
        'application',
        'platform',
      ],
      TELECOMMUNICATIONS: [
        'telecommunications',
        'telecom',
        'network',
        'wireless',
      ],
      EDUCATION: [
        'education',
        'university',
        'college',
        'academic',
        'school',
        'learning',
      ],
      MANUFACTURING: ['manufacturing', 'production', 'industrial', 'factory'],
      RETAIL: ['retail', 'store', 'sales', 'commerce', 'merchandise'],
      ENGINEERING: ['engineering', 'engineer', 'technical'],
      MEDIA: [
        'media',
        'advertising',
        'marketing',
        'communications',
        'publishing',
      ],
      BIOTECHNOLOGY: [
        'biotech',
        'biotechnology',
        'life sciences',
        'pharmaceutical',
      ],
      ENERGY: ['energy', 'oil', 'gas', 'renewable', 'power', 'utilities'],
      GOVERNMENT: [
        'government',
        'federal',
        'state',
        'public sector',
        'municipal',
      ],
      ENTERTAINMENT: ['entertainment', 'gaming', 'music', 'film', 'television'],
      AEROSPACE: ['aerospace', 'aviation', 'defense', 'military'],
    };

    const jobDescriptionLower = jobDescriptionText.toLowerCase();
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((keyword) => jobDescriptionLower.includes(keyword))) {
        jobDetails.companyDetails.industry = industry;
        break;
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
