import { Company, Job } from '../types';

export const mockCompanies: Company[] = [
  {
    id: 'google',
    name: 'Google',
    logoUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&h=128&fit=crop&crop=faces&q=80',
    about: 'Google is a global technology leader focused on improving the ways people connect with information. Our innovations in web search and advertising have made our site a top Internet property and our brand one of the most recognized worldwide.',
    websiteUrl: 'https://careers.google.com',
    headquarters: 'Mountain View, CA',
    founded: '1998',
    employees: '180,000+',
    bannerGradient: 'from-blue-600 via-emerald-500 to-amber-500',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logoUrl: 'https://images.unsplash.com/photo-1642132652075-2b23a9d9842f?w=128&h=128&fit=crop&crop=faces&q=80',
    about: 'Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge. Its mission is to empower every person and every organization on the planet to achieve more through world-class software and cloud computing.',
    websiteUrl: 'https://careers.microsoft.com',
    headquarters: 'Redmond, WA',
    founded: '1975',
    employees: '220,000+',
    bannerGradient: 'from-sky-600 via-blue-700 to-indigo-800',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logoUrl: 'https://images.unsplash.com/photo-1523474255658-4af61b1614ff?w=128&h=128&fit=crop&crop=faces&q=80',
    about: 'Amazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking through AWS, Prime, and logistics automation.',
    websiteUrl: 'https://www.amazon.jobs',
    headquarters: 'Seattle, WA',
    founded: '1994',
    employees: '1,500,000+',
    bannerGradient: 'from-amber-600 via-orange-600 to-neutral-900',
  },
  {
    id: 'meta',
    name: 'Meta',
    logoUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=128&h=128&fit=crop&crop=faces&q=80',
    about: 'Meta builds technologies that help people connect, find communities, and grow businesses. When Facebook launched in 2004, it changed the way people connect. Apps like Messenger, Instagram, and WhatsApp further empowered billions around the world.',
    websiteUrl: 'https://www.metacareers.com',
    headquarters: 'Menlo Park, CA',
    founded: '2004',
    employees: '67,000+',
    bannerGradient: 'from-blue-600 via-indigo-600 to-purple-700',
  },
  {
    id: 'apple',
    name: 'Apple',
    logoUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&h=128&fit=crop&crop=faces&q=80',
    about: 'Apple revolutionised personal technology with the introduction of the Macintosh in 1984. Today, Apple leads the world in innovation with iPhone, iPad, Mac, Apple Watch, and Apple Vision Pro, alongside seamless cloud platforms.',
    websiteUrl: 'https://www.apple.com/careers',
    headquarters: 'Cupertino, CA',
    founded: '1976',
    employees: '161,000+',
    bannerGradient: 'from-neutral-700 via-neutral-800 to-zinc-900',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logoUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&h=128&fit=crop&crop=faces&q=80',
    about: 'Netflix is one of the world’s leading entertainment services with over 260 million paid memberships in over 190 countries enjoying TV series, documentaries, feature films, and games across a wide variety of genres and languages.',
    websiteUrl: 'https://jobs.netflix.com',
    headquarters: 'Los Gatos, CA',
    founded: '1997',
    employees: '13,000+',
    bannerGradient: 'from-red-600 via-rose-700 to-neutral-950',
  },
];

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Software Engineer, Core Infrastructure',
    companyId: 'google',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Mountain View, CA (Hybrid)',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$185,000 - $250,000 / year',
    postedDate: '2026-09-10',
    isActive: true,
    department: 'Engineering',
    isRemote: false,
    applicationUrl: 'https://careers.google.com/jobs/results/',
    description: 'Join the team building foundational systems powering Search, Workspace, and Cloud. You will architect high-throughput, low-latency distributed microservices serving billions of requests per second worldwide with fault-tolerant guarantees.',
    responsibilities: [
      'Design, build, and maintain mission-critical distributed storage and retrieval systems with 99.999% availability.',
      'Collaborate cross-functionally with networking, security, and hardware teams to optimize memory and compute footprint.',
      'Conduct architecture and code reviews, mentor junior and mid-level engineers, and drive best coding practices in C++ and Go.',
      'Analyze and debug complex production incidents using internal tracing, observability, and profiling platforms.'
    ],
    requirements: [
      "Bachelor's or Master's degree in Computer Science, Computer Engineering, or equivalent practical experience.",
      '5+ years of experience with distributed backend systems, multi-threading, concurrency, and RPC architectures.',
      'Proficiency in C++, Go, or modern Java with deep knowledge of memory management and Linux internals.',
      'Proven track record of deploying large-scale systems serving high throughput workloads.'
    ],
    qualifications: [
      'Experience with distributed consensus algorithms (Paxos, Raft).',
      'Knowledge of cloud container orchestration (Kubernetes, Borg) and observability tooling.',
      'Strong communication skills and enthusiasm for developer tooling.'
    ]
  },
  {
    id: 'job-2',
    title: 'Senior Frontend Developer, Design Systems',
    companyId: 'meta',
    companyName: 'Meta',
    companyLogo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Menlo Park, CA (Remote Eligible)',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$175,000 - $235,000 / year',
    postedDate: '2026-09-11',
    isActive: true,
    department: 'Product Engineering',
    isRemote: true,
    applicationUrl: 'https://www.metacareers.com/jobs',
    description: 'We are looking for a Senior Frontend Developer to lead evolution of Meta’s core web design systems across Instagram and Facebook web applications. You will create accessible, modular, high-performance UI components used by thousands of internal engineers.',
    responsibilities: [
      'Architect and evolve the core component library using TypeScript, React 19, and CSS-in-JS tooling.',
      'Enforce WCAG 2.1 AA accessibility standards across interactive controls, modals, and navigation primitives.',
      'Build automated visual regression testing pipelines and benchmark runtime bundle size and rendering speeds.',
      'Partner closely with product design leads to define design tokens, motion specs, and responsive grid layouts.'
    ],
    requirements: [
      '5+ years building enterprise React web applications with deep mastery of TypeScript and modern browser APIs.',
      'In-depth knowledge of web performance (Core Web Vitals, tree-shaking, code splitting, memoization).',
      'Hands-on expertise in creating and maintaining public or internal component design systems.',
      'Strong empathy for both developer experience and end-user accessibility.'
    ],
    qualifications: [
      'Contributions to open-source UI libraries or framework tooling.',
      'Experience with micro-frontends or module federation architectures.',
      'Familiarity with WebGL or Canvas rendering for interactive data visualizations.'
    ]
  },
  {
    id: 'job-3',
    title: 'Data Scientist, Applied Machine Learning',
    companyId: 'microsoft',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642132652075-2b23a9d9842f?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Redmond, WA',
    jobType: 'Full-time',
    experienceLevel: 'Mid',
    salaryRange: '$140,000 - $185,000 / year',
    postedDate: '2026-09-08',
    isActive: true,
    department: 'Azure AI',
    isRemote: false,
    applicationUrl: 'https://careers.microsoft.com/us/en/search-results',
    description: 'Join the Azure AI team to research, train, and deploy advanced neural network models. You will work alongside researchers to optimize generative model inference, implement RLHF workflows, and deliver intelligence features to enterprise customers.',
    responsibilities: [
      'Develop and fine-tune large language and multimodal models for enterprise document synthesis and classification.',
      'Build scalable data ingestion and preprocessing pipelines processing petabytes of multimodal inputs.',
      'Design rigorous offline evaluation metrics and conduct online A/B experimentation to validate model efficacy.',
      'Collaborate with Azure cloud infrastructure teams to accelerate inference via ONNX and TensorRT.'
    ],
    requirements: [
      "Master's or Ph.D. in Computer Science, Statistics, Mathematics, or related quantitative field.",
      '3+ years of applied experience training deep learning models using PyTorch or TensorFlow.',
      'Strong coding skills in Python, SQL, and distributed data processing frameworks (Spark, Ray).',
      'Solid foundation in probability, hypothesis testing, and statistical learning.'
    ],
    qualifications: [
      'Published papers at top AI/ML conferences (NeurIPS, ICML, CVPR, ACL).',
      'Experience with transformer architectures and quantization techniques (AWQ, GPTQ).',
      'Familiarity with Azure ML or AWS SageMaker platforms.'
    ]
  },
  {
    id: 'job-4',
    title: 'Cloud Infrastructure & DevOps Engineer',
    companyId: 'amazon',
    companyName: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474255658-4af61b1614ff?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Seattle, WA',
    jobType: 'Full-time',
    experienceLevel: 'Mid',
    salaryRange: '$145,000 - $190,000 / year',
    postedDate: '2026-09-09',
    isActive: true,
    department: 'AWS Platform',
    isRemote: false,
    applicationUrl: 'https://www.amazon.jobs/en/search',
    description: 'Amazon Web Services is seeking a DevOps Engineer to automate deployment pipelines, enhance resilience, and govern cloud infrastructure across global availability zones. You will champion infrastructure-as-code and zero-touch continuous deployment.',
    responsibilities: [
      'Manage multi-region AWS cloud environments using Terraform, AWS CDK, and CloudFormation.',
      'Implement automated blue/green canary deployment workflows with continuous automated rollbacks on health anomalies.',
      'Drive telemetry integration with Prometheus, Grafana, OpenTelemetry, and AWS CloudWatch.',
      'Participate in on-call rotation to maintain fleet reliability, resolving operational blockers proactively.'
    ],
    requirements: [
      '3+ years of experience in site reliability, systems engineering, or DevOps roles.',
      'Extensive experience with AWS services (EC2, ECS/EKS, VPC, Route53, IAM, S3).',
      'Proficiency in scripting and automation with Python, Bash, or Go.',
      'Deep knowledge of CI/CD pipelines (GitHub Actions, GitLab CI, or Jenkins).'
    ],
    qualifications: [
      'AWS Certified DevOps Engineer or Solutions Architect Professional.',
      'Experience with Chaos Engineering principles and disaster recovery testing.',
      'Understanding of zero-trust security postures and compliance frameworks.'
    ]
  },
  {
    id: 'job-5',
    title: 'Lead Product Manager, Next-Gen OS Experiences',
    companyId: 'apple',
    companyName: 'Apple',
    companyLogo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Cupertino, CA',
    jobType: 'Full-time',
    experienceLevel: 'Lead',
    salaryRange: '$210,000 - $285,000 / year',
    postedDate: '2026-09-07',
    isActive: true,
    department: 'Product Management',
    isRemote: false,
    applicationUrl: 'https://jobs.apple.com/en-us/search',
    description: 'As a Lead Product Manager at Apple, you will define the roadmap and feature specifications for cross-device ecosystem continuity across macOS, iOS, and visionOS. You will lead cross-functional execution across engineering, industrial design, and marketing.',
    responsibilities: [
      'Define vision, roadmap, and PRDs for intelligent ecosystem features seamlessly bridging Mac, iPhone, and Apple Vision.',
      'Coordinate with Human Interface Design to craft intuitive, delight-driven consumer interaction patterns.',
      'Analyze customer telemetry, field feedback, and usability labs to drive iterative improvements.',
      'Present strategic product briefings and release readiness milestones to executive leadership.'
    ],
    requirements: [
      '7+ years of product management experience shipping consumer hardware or operating system software.',
      'Proven ability to synthesize complex technological capabilities into simple, intuitive user stories.',
      'Exceptional cross-functional leadership, influencing without formal authority.',
      'Deep appreciation for craft, typography, hardware-software harmony, and user privacy.'
    ],
    qualifications: [
      'Technical background with prior engineering or computer science degree.',
      'Experience with privacy-preserving machine learning and on-device intelligence.',
      'Track record of presenting at industry product keynotes or developer conferences.'
    ]
  },
  {
    id: 'job-6',
    title: 'Senior Backend Systems Engineer, Streaming Media',
    companyId: 'netflix',
    companyName: 'Netflix',
    companyLogo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Los Gatos, CA (Remote)',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$200,000 - $270,000 / year',
    postedDate: '2026-09-12',
    isActive: true,
    department: 'Streaming Engineering',
    isRemote: true,
    applicationUrl: 'https://jobs.netflix.com/search',
    description: 'Netflix is expanding the team responsible for live event streaming and adaptive bitrate encoding pipelines. You will design backend services that stream ultra-low-latency video to hundreds of millions of concurrent global viewers without buffering.',
    responsibilities: [
      'Engineer fault-tolerant video ingest and packaging microservices running on AWS and Netflix Open Connect CDNs.',
      'Develop real-time quality-of-experience (QoE) tracking engines assessing bitrate shifts and packet loss.',
      'Optimize network transport protocols (QUIC, WebTransport, HTTP/3) for constrained edge networks.',
      'Participate in architecture design for massive live streaming spectacles watched by tens of millions simultaneously.'
    ],
    requirements: [
      '5+ years of software engineering experience focusing on real-time systems, network protocols, or video streaming.',
      'Strong programming competence in Java, Kotlin, Go, or C++.',
      'Solid grasp of distributed systems primitives, caching strategies (Redis, Memcached), and asynchronous messaging (Kafka).',
      'Comfort working in a high-autonomy, high-accountability engineering culture.'
    ],
    qualifications: [
      'Hands-on familiarity with video codecs (AV1, HEVC, H.264) and streaming protocols (HLS, DASH, WebRTC).',
      'Experience with distributed tracing (Zipkin, Jaeger) and high-cardinality telemetry.',
      'Demonstrated experience troubleshooting production kernel network bottlenecks.'
    ]
  },
  {
    id: 'job-7',
    title: 'Machine Learning Research Intern, Summer 2027',
    companyId: 'google',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'New York, NY',
    jobType: 'Internship',
    experienceLevel: 'Entry',
    salaryRange: '$52 - $68 / hour',
    postedDate: '2026-09-12',
    isActive: true,
    department: 'Google DeepMind',
    isRemote: false,
    applicationUrl: 'https://careers.google.com/jobs/results/',
    description: 'Spend your summer conducting cutting-edge AI research with Google DeepMind researchers in NYC. You will investigate novel reinforcement learning algorithms, multimodal reasoning benchmarks, and mechanistic interpretability of foundation models.',
    responsibilities: [
      'Implement and evaluate experimental neural architectures using JAX and PyTorch on TPU v5p clusters.',
      'Analyze training dynamics, attention activation patterns, and loss convergence curves.',
      'Document findings and collaborate on potential co-authored research submissions to top AI conferences.',
      'Present research milestones at weekly internal lab seminars.'
    ],
    requirements: [
      'Currently enrolled in a PhD or research-track Master’s program in Computer Science, Machine Learning, or Physics.',
      'Proficiency in Python, scientific computing libraries (NumPy, SciPy), and modern deep learning frameworks.',
      'Prior coursework or research projects in deep learning, transformer architectures, or reinforcement learning.'
    ],
    qualifications: [
      'One or more accepted conference papers or preprint contributions.',
      'Experience scaling models across distributed TPU or GPU accelerators.',
      'Strong mathematical fundamentals in linear algebra and optimization.'
    ]
  },
  {
    id: 'job-8',
    title: 'Full Stack Software Engineer, Retail Platforms',
    companyId: 'amazon',
    companyName: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474255658-4af61b1614ff?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Austin, TX (Hybrid)',
    jobType: 'Full-time',
    experienceLevel: 'Mid',
    salaryRange: '$135,000 - $175,000 / year',
    postedDate: '2026-09-05',
    isActive: true,
    department: 'Consumer Retail',
    isRemote: false,
    applicationUrl: 'https://www.amazon.jobs/en/search',
    description: 'We are seeking an energetic Full Stack Engineer to innovate checkout friction and real-time inventory discovery for Amazon Consumer Retail. You will build customer-facing web apps and high-scale GraphQL API services.',
    responsibilities: [
      'Develop responsive web interfaces with Next.js, React, and TypeScript with rigorous accessibility compliance.',
      'Build and maintain microservices in Java and Node.js connected to Amazon DynamoDB and Aurora PostgreSQL.',
      'Implement real-time inventory websocket updates and dynamic pricing displays.',
      'Write end-to-end integration test suites ensuring 99.99% transaction reliability during Prime Day surges.'
    ],
    requirements: [
      '3+ years of full-stack web development experience with modern JavaScript frameworks and backend REST/GraphQL APIs.',
      'Experience with relational or NoSQL datastores (PostgreSQL, DynamoDB, MongoDB).',
      'Solid grasp of web fundamentals (HTTP/HTTPS, CORS, browser storage, DOM performance).',
      'Strong problem-solving ability and dedication to customer experience.'
    ],
    qualifications: [
      'Prior e-commerce or checkout conversion optimization experience.',
      'Familiarity with serverless compute (AWS Lambda, Step Functions).',
      'Experience mentoring junior engineers or leading scrum standups.'
    ]
  },
  {
    id: 'job-9',
    title: 'iOS Software Engineer, Health & Fitness',
    companyId: 'apple',
    companyName: 'Apple',
    companyLogo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'San Diego, CA',
    jobType: 'Full-time',
    experienceLevel: 'Mid',
    salaryRange: '$150,000 - $195,000 / year',
    postedDate: '2026-09-06',
    isActive: true,
    department: 'Apple Health',
    isRemote: false,
    applicationUrl: 'https://jobs.apple.com/en-us/search',
    description: 'The Apple Health team creates software that empowers millions of users to monitor and improve their well-being. We are looking for an iOS Engineer to build intuitive, fluid, privacy-centered experiences for iOS and watchOS.',
    responsibilities: [
      'Develop new user experiences using Swift, SwiftUI, and UIKit adhering to Apple Human Interface Guidelines.',
      'Integrate with HealthKit, CoreMotion, and on-device sensor fusion algorithms.',
      'Ensure absolute user data privacy and encrypted on-device health record storage.',
      'Partner with clinical specialists and biomedical engineers to translate medical research into consumer features.'
    ],
    requirements: [
      '3+ years of native iOS app development experience using Swift and modern Apple frameworks.',
      'Demonstrated mastery of SwiftUI, concurrency (Swift async/await), and modular app architecture.',
      'Experience profiling memory, CPU, and battery consumption using Instruments.',
      'Obsession with smooth 120Hz animations and pixel-perfect UI craftsmanship.'
    ],
    qualifications: [
      'Shipped at least one highly rated app on the iOS App Store.',
      'Experience with watchOS or CoreBluetooth sensor integrations.',
      'Familiarity with HIPAA guidelines and health data compliance.'
    ]
  },
  {
    id: 'job-10',
    title: 'Staff Site Reliability Engineer, Global Edge Network',
    companyId: 'netflix',
    companyName: 'Netflix',
    companyLogo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Los Gatos, CA (Remote)',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$225,000 - $310,000 / year',
    postedDate: '2026-09-03',
    isActive: true,
    department: 'Cloud Reliability',
    isRemote: true,
    applicationUrl: 'https://jobs.netflix.com/search',
    description: 'Netflix is looking for an experienced Staff SRE to build autonomous self-healing capabilities for our global traffic routing mesh. You will ensure seamless multi-region failover and maintain zero streaming disruptions for millions of viewers.',
    responsibilities: [
      'Architect automated traffic steering systems directing thousands of Gbps across cloud regions and internet exchanges.',
      'Implement automated chaos injection scenarios to discover edge failure modes before they affect members.',
      'Design predictive anomaly detection models over billions of edge metrics per minute.',
      'Serve as incident commander for critical production events and lead blameless post-mortems.'
    ],
    requirements: [
      '8+ years in SRE, platform, or systems engineering roles supporting ultra-high-scale consumer internet systems.',
      'Deep expertise with internet routing (BGP, DNS, Anycast), TCP/IP protocols, and CDN architectures.',
      'Proficiency in Python, Go, or Rust with experience writing high-performance network automation tools.',
      'Exceptional leadership skills and experience guiding engineering resilience strategy.'
    ],
    qualifications: [
      'Prior contributions to Envoy proxy, eBPF network tooling, or Linux networking stack.',
      'Experience leading multi-datacenter migration or disaster recovery simulations.',
      'Author of published tech blogs or conference presentations on distributed resilience.'
    ]
  },
  {
    id: 'job-11',
    title: 'AI Research Scientist, Foundation Models',
    companyId: 'meta',
    companyName: 'Meta',
    companyLogo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Seattle, WA',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$215,000 - $295,000 / year',
    postedDate: '2026-09-02',
    isActive: true,
    department: 'FAIR (Fundamental AI Research)',
    isRemote: false,
    applicationUrl: 'https://www.metacareers.com/jobs',
    description: 'Join the Fundamental AI Research (FAIR) team at Meta to conduct exploratory research in open foundation models, multimodal representations, and automated scientific discovery. We provide access to industry-leading GPU clusters and open-source our key milestones.',
    responsibilities: [
      'Conduct original research pushing the boundaries of unsupervised representation learning and reasoning in AI.',
      'Scale model training across clusters of tens of thousands of H100/B200 GPUs using Megatron and FSDP.',
      'Publish research findings in peer-reviewed venues and release open-weight checkpoints to the broader research community.',
      'Collaborate with university researchers and open-source AI developer collectives.'
    ],
    requirements: [
      'Ph.D. in Computer Science, Machine Learning, Artificial Intelligence, or equivalent field.',
      'Demonstrated track record of first-author publications at top-tier venues (NeurIPS, ICML, ICLR, CVPR).',
      'Strong implementation expertise with PyTorch and distributed training libraries (DeepSpeed, Megatron-LM).',
      'Solid theoretical foundation in neural scaling laws, optimization theory, or information theory.'
    ],
    qualifications: [
      'Prior experience training 70B+ parameter generative models.',
      'Experience with synthetic data generation techniques and self-play algorithms.',
      'Active contributor to popular open-source deep learning repositories.'
    ]
  },
  {
    id: 'job-12',
    title: 'Cloud Solutions Architect, Enterprise Modernization',
    companyId: 'microsoft',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642132652075-2b23a9d9842f?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Chicago, IL (Hybrid)',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$165,000 - $215,000 / year',
    postedDate: '2026-09-04',
    isActive: true,
    department: 'Enterprise Customer Success',
    isRemote: false,
    applicationUrl: 'https://careers.microsoft.com/us/en/search-results',
    description: 'As a Cloud Solutions Architect at Microsoft, you will guide Fortune 500 enterprises through multi-million dollar cloud transformations. You will architect hybrid cloud blueprints, zero-trust architectures, and AI-enabled business workflows.',
    responsibilities: [
      'Lead technical discovery sessions with Enterprise CIOs, CTOs, and principal architects to define cloud strategy.',
      'Author end-to-end architecture designs for Azure microservices, database migrations, and disaster recovery.',
      'Build proof-of-concept solutions illustrating Azure OpenAI, Microsoft Fabric, and Copilot Studio integrations.',
      'Provide escalation guidance during critical client deployment phases and ensure architectural compliance.'
    ],
    requirements: [
      '5+ years in solutions architecture, technical consulting, or enterprise systems engineering.',
      'Deep practical expertise in Azure, AWS, or GCP cloud platforms.',
      'Comprehensive understanding of networking, identity governance (Entra ID), and data privacy regulations.',
      'Outstanding presentation and stakeholder communication abilities.'
    ],
    qualifications: [
      'Azure Solutions Architect Expert certification or equivalent credentials.',
      'Experience in financial services, healthcare, or government sector cloud compliance.',
      'Background in container orchestration and hybrid cloud networking.'
    ]
  },
  {
    id: 'job-13',
    title: 'Product Designer (UI/UX), Developer Platforms',
    companyId: 'google',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    experienceLevel: 'Mid',
    salaryRange: '$140,000 - $185,000 / year',
    postedDate: '2026-09-08',
    isActive: true,
    department: 'Google Cloud UX',
    isRemote: false,
    applicationUrl: 'https://careers.google.com/jobs/results/',
    description: 'We are looking for a Product Designer who loves solving complex technical problems to join Google Cloud UX. You will design developer console experiences, cloud debugging workflows, and interactive API documentation that developers love to use daily.',
    responsibilities: [
      'Design user flows, wireframes, and high-fidelity prototypes in Figma for complex cloud developer tools.',
      'Conduct usability tests with software engineers, cloud architects, and data analysts to identify pain points.',
      'Partner with front-end engineers to implement pixel-perfect Material 3 design specs and motion design.',
      'Contribute to design system patterns supporting dense data tables, graphs, and code editor integrations.'
    ],
    requirements: [
      '3+ years of experience designing technical products, developer tools, or enterprise SaaS applications.',
      'A strong design portfolio showcasing user-centered problem solving, information architecture, and UI craft.',
      'Proficiency with industry standard tools (Figma, FigJam, prototyping software).',
      'Ability to clearly articulate design rationale to engineering and product partners.'
    ],
    qualifications: [
      'Basic knowledge of HTML/CSS/JavaScript and familiarity with code development workflows.',
      'Experience designing accessibility-first workflows for complex enterprise dashboards.',
      'Strong visual storytelling and workshop facilitation skills.'
    ]
  },
  {
    id: 'job-14',
    title: 'Frontend Engineering Intern, Winter/Spring 2027',
    companyId: 'meta',
    companyName: 'Meta',
    companyLogo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Menlo Park, CA',
    jobType: 'Internship',
    experienceLevel: 'Entry',
    salaryRange: '$50 - $65 / hour',
    postedDate: '2026-09-11',
    isActive: true,
    department: 'Messenger & Threads',
    isRemote: false,
    applicationUrl: 'https://www.metacareers.com/jobs',
    description: 'Meta is hiring Frontend Engineering Interns for our Menlo Park headquarters. You will work side-by-side with full-time software engineers to deliver real features to millions of active users on Threads and Instagram Web.',
    responsibilities: [
      'Build performant, accessible UI components using React, Relay, and GraphQL.',
      'Work with product managers and designers to test new social interaction features.',
      'Write comprehensive unit tests with Jest and React Testing Library.',
      'Participate in code reviews, engineering tech talks, and hackathon projects.'
    ],
    requirements: [
      'Currently enrolled in a Bachelor’s or Master’s program in Computer Science or related discipline.',
      'Solid understanding of JavaScript, HTML5, CSS3, and modern React concepts (hooks, state management).',
      'Knowledge of fundamental computer science concepts (algorithms, data structures, complexity analysis).'
    ],
    qualifications: [
      'Personal projects or hackathon submissions showcasing creative web development.',
      'Familiarity with TypeScript and Git version control.',
      'Passionate about social connection and consumer mobile-web interfaces.'
    ]
  },
  {
    id: 'job-15',
    title: 'Security Software Engineer, Platform Hardening',
    companyId: 'apple',
    companyName: 'Apple',
    companyLogo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&h=128&fit=crop&crop=faces&q=80',
    location: 'Austin, TX',
    jobType: 'Contract',
    experienceLevel: 'Mid',
    salaryRange: '$85 - $115 / hour',
    postedDate: '2026-09-01',
    isActive: true,
    department: 'Information Security',
    isRemote: false,
    applicationUrl: 'https://jobs.apple.com/en-us/search',
    description: 'Apple Information Security is seeking a contract Security Software Engineer to audit internal microservices, build vulnerability scanning automation, and harden cryptographic key distribution services.',
    responsibilities: [
      'Perform security architecture reviews and automated static/dynamic code analysis (SAST/DAST).',
      'Develop automated remediation scripts and security policy enforcement gates in CI/CD pipelines.',
      'Investigate potential security vulnerabilities and coordinate patching schedules with engineering leads.',
      'Maintain automated certificate rotation and secrets management infrastructure.'
    ],
    requirements: [
      '3+ years in security engineering, penetration testing, or application security.',
      'Familiarity with OWASP Top 10, common memory corruption vulnerabilities, and modern web exploits.',
      'Proficiency in Python, Go, or C/C++.',
      'Experience with security assessment tools (Burp Suite, Semgrep, Snyk).'
    ],
    qualifications: [
      'Industry certifications such as CISSP, OSCP, or CEH.',
      'Experience with cloud security posture management (CSPM).',
      'Understanding of hardware security enclaves and cryptography primitives.'
    ]
  }
];
