// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-bio",
    title: "Bio",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-resume",
          title: "Resume",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/resume/";
          },
        },{id: "nav-ask",
          title: "Ask",
          description: "Ask a question about my research and get an answer drawn from the notes on this site, with the sources it used.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/ask/";
          },
        },{id: "nav-awards",
          title: "Awards",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/awards/";
          },
        },{id: "nav-blog",
          title: "Blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-card",
          title: "Card",
          description: "Scan, save, or share my contact details.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/card/";
          },
        },{id: "post-edgelm-edge-demonstrations-for-language-models-39-table-understanding",
      
        title: "EdgeLM: Edge Demonstrations for Language Models&#39; Table Understanding",
      
      description: "Choosing demonstrations that show a model where the hard distinctions lie",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/posts/edgelm/";
        
      },
    },{id: "post-ldi-localized-data-imputation-for-text-rich-tables",
      
        title: "LDI: Localized Data Imputation for Text-Rich Tables",
      
      description: "Building a small, targeted context for each missing value",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/posts/ldi/";
        
      },
    },{id: "post-webtablex-efficiently-discovering-web-table-transformations-through-sampling",
      
        title: "WebTableX: Efficiently Discovering Web Table Transformations Through Sampling",
      
      description: "Sampling a few representative rows to find join rules much faster",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/posts/webtablex/";
        
      },
    },{id: "post-gxjoin-generalized-cell-transformations-for-explainable-joinability",
      
        title: "GXJoin: Generalized Cell Transformations for Explainable Joinability",
      
      description: "Learning general join rules from a few examples",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/posts/gxjoin/";
        
      },
    },{id: "post-latex-learning-v2-1",
      
        title: "LaTeX Learning v2.1",
      
      description: "Learn LaTeX step by step with easy examples",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/posts/latex-v2/";
        
      },
    },{id: "post-latex-learning-v1-0",
      
        title: "LaTeX Learning v1.0",
      
      description: "A quick guide to writing with LaTeX (Presentation)",
      section: "Posts",
      handler: () => {
        
          window.location.href = "/posts/2020-11-30-latex-v1/";
        
      },
    },{id: "knowledge-overview",
          title: 'Overview',
          description: "",
          section: "Knowledge",handler: () => {
              window.location.href = "/knowledge/01-overview/";
            },},{id: "knowledge-concepts",
          title: 'Concepts',
          description: "",
          section: "Knowledge",handler: () => {
              window.location.href = "/knowledge/02-concepts/";
            },},{id: "knowledge-publications",
          title: 'Publications',
          description: "",
          section: "Knowledge",handler: () => {
              window.location.href = "/knowledge/03-publications/";
            },},{id: "knowledge-background",
          title: 'Background',
          description: "",
          section: "Knowledge",handler: () => {
              window.location.href = "/knowledge/04-background/";
            },},{id: "knowledge-practical",
          title: 'Practical',
          description: "",
          section: "Knowledge",handler: () => {
              window.location.href = "/knowledge/05-faq/";
            },},{id: "news-a-simple-inline-announcement",
          title: 'A simple inline announcement.',
          description: "",
          section: "News",},{id: "news-a-long-announcement-with-details",
          title: 'A long announcement with details',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "news-a-simple-inline-announcement-with-markdown-emoji-sparkles-smile",
          title: 'A simple inline announcement with Markdown emoji! :sparkles: :smile:',
          description: "",
          section: "News",},{id: "projects-project-1",
          title: 'project 1',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-project-2",
          title: 'project 2',
          description: "a project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-project-3-with-very-long-name",
          title: 'project 3 with very long name',
          description: "a project that redirects to another website",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "projects-project-4",
          title: 'project 4',
          description: "another without an image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_project/";
            },},{id: "projects-project-7",
          title: 'project 7',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/7_project/";
            },},{id: "projects-project-8",
          title: 'project 8',
          description: "an other project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/8_project/";
            },},{id: "projects-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/projects/9_project/";
            },},{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
