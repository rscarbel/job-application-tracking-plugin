async function indeedParser(defaultJobDetails) {
  const jobDetails = JSON.parse(JSON.stringify(defaultJobDetails));
  const domain = window.location.href;

  // Check if we're on an Indeed job page
  if (!domain.includes('indeed.com') || !domain.includes('vjk=')) {
    console.info('Not on an Indeed job posting page');
    return defaultJobDetails;
  }

  try {
    console.info('Parsing Indeed job posting');

    const isIndivdualJobPage = domain.includes('viewJob?jk=');
    const jobIdMatch = domain.match(/vjk=([a-zA-Z0-9]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;
    console.info('Job ID:', jobId);

    let companyElement = document.querySelector(
      '.jobsearch-JobInfoHeader-companyNameSimple'
    );
    if (companyElement) {
      jobDetails.companyName = companyElement.textContent.trim().split('\n')[0];
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
      const locationText = locationElement.textContent.trim();

      const locationParts = locationText.split(/,\s*/);

      if (locationParts.length >= 1) {
        jobDetails.location.city = locationParts[0].trim();
      }

      if (locationParts.length >= 2) {
        jobDetails.location.state = locationParts[1].trim();
      }

      if (locationParts.length >= 3) {
        jobDetails.location.country = locationParts[2].trim();
      }
    }

    const salaryElement = document.querySelector(
      '[data-testid="attribute_snippet_testid"] div:has(> span:first-child):not(:has(.metadata)),' +
        '[data-testid="attribute_snippet_testid"] div.css-18z4q2i,' +
        '.metadata.salary-snippet-container div[data-testid*="salary"],' +
        '.metadata.salary-snippet-container .css-18z4q2i,' +
        '.metadata.salary-snippet-container .css-ws1fr0,' +
        '#salaryInfoAndJobType span,' +
        '.jobsearch-JobMetadataHeader-item:has(.salary-icon)'
    );

    if (salaryElement) {
      const salaryText = salaryElement.textContent.trim();

      const salaryRangePattern =
        /\$?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:-|to)\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:a|per)?\s*(hour|hr|yr|year|annually|monthly|month|week|wk|day)?/i;
      const salaryMatch = salaryText.match(salaryRangePattern);

      if (salaryMatch) {
        let minSalary = salaryMatch[1].replace(/,/g, '');
        let maxSalary = salaryMatch[2].replace(/,/g, '');

        // Handle K notation
        if (salaryText.match(/[kK]/)) {
          minSalary = parseFloat(minSalary) * 1000;
          maxSalary = parseFloat(maxSalary) * 1000;
        } else {
          minSalary = parseFloat(minSalary);
          maxSalary = parseFloat(maxSalary);
        }

        jobDetails.compensation.salaryRangeMin = minSalary.toString();
        jobDetails.compensation.salaryRangeMax = maxSalary.toString();

        const frequencyText = salaryMatch[3]
          ? salaryMatch[3].toLowerCase()
          : '';
        if (frequencyText.includes('hour') || frequencyText.includes('hr')) {
          jobDetails.compensation.payFrequency = 'HOURLY';
        } else if (frequencyText.includes('month')) {
          jobDetails.compensation.payFrequency = 'MONTHLY';
        } else if (
          frequencyText.includes('week') ||
          frequencyText.includes('wk')
        ) {
          jobDetails.compensation.payFrequency = 'WEEKLY';
        } else {
          // Default to annually for "a year", "year", "yr", or no frequency specified
          jobDetails.compensation.payFrequency = 'ANNUALLY';
        }
      } else {
        const singleSalaryPattern =
          /\$?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:a|per)?\s*(hour|hr|yr|year|annually|monthly|month|week|wk|day)?/i;
        const singleSalaryMatch = salaryText.match(singleSalaryPattern);

        if (singleSalaryMatch) {
          let salary = singleSalaryMatch[1].replace(/,/g, '');

          if (salaryText.match(/[kK]/)) {
            salary = parseFloat(salary) * 1000;
          } else {
            salary = parseFloat(salary);
          }

          jobDetails.compensation.payAmount = salary.toString();

          const frequencyText = singleSalaryMatch[2]
            ? singleSalaryMatch[2].toLowerCase()
            : '';
          if (frequencyText.includes('hour') || frequencyText.includes('hr')) {
            jobDetails.compensation.payFrequency = 'HOURLY';
          } else if (frequencyText.includes('month')) {
            jobDetails.compensation.payFrequency = 'MONTHLY';
          } else if (
            frequencyText.includes('week') ||
            frequencyText.includes('wk')
          ) {
            jobDetails.compensation.payFrequency = 'WEEKLY';
          } else {
            jobDetails.compensation.payFrequency = 'ANNUALLY';
          }
        }
      }
    }

    const jobDescriptionElement = document.getElementById('jobDescriptionText');
    if (jobDescriptionElement) {
      jobDetails.jobDescription = jobDescriptionElement.innerText
        .trim()
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+/gm, '');
    }

    const jobDescriptionText = jobDescriptionElement
      ? jobDescriptionElement.textContent
      : '';

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
