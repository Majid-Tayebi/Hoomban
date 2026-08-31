/// <reference path="../pb_data/types.d.ts" />

/**
 * Import public content from https://hoomban.com/
 * Photos for specialists will be added later by the client.
 * Placeholder mobiles are for QA OTP login only (OTP = 1234 in app).
 */
migrate((app) => {
  const DEMO_PASSWORD = "UserPassword123!";
  const weekdays = [
    { day: "شنبه", enabled: true, startTime: "09:00", endTime: "13:00" },
    { day: "یکشنبه", enabled: true, startTime: "09:00", endTime: "18:30" },
    { day: "دوشنبه", enabled: true, startTime: "09:00", endTime: "18:30" },
    { day: "سه‌شنبه", enabled: true, startTime: "09:00", endTime: "18:30" },
    { day: "چهارشنبه", enabled: true, startTime: "09:00", endTime: "18:30" },
    { day: "پنج‌شنبه", enabled: true, startTime: "09:00", endTime: "13:00" },
    { day: "جمعه", enabled: false, startTime: "", endTime: "" }
  ];

  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  const staff = app.findCollectionByNameOrId("staff_registry");
  const doctors = app.findCollectionByNameOrId("doctors");

  if (!doctors.fields.getByName("specialty")) {
    doctors.fields.add(new Field({ id: "text_doc_specialty", name: "specialty", type: "text", required: false, max: 120 }));
  }
  if (!doctors.fields.getByName("is_active")) {
    doctors.fields.add(new Field({ id: "bool_doc_active", name: "is_active", type: "bool", required: false }));
  }
  if (!doctors.fields.getByName("sort_order")) {
    doctors.fields.add(new Field({ id: "num_doc_sort", name: "sort_order", type: "number", required: false, min: 0 }));
  }
  app.save(doctors);

  // ---------- services schema ----------
  const services = app.findCollectionByNameOrId("services");
  const addSvc = (def) => {
    if (!services.fields.getByName(def.name)) services.fields.add(new Field(def));
  };
  addSvc({ id: "text_svc_title", name: "title", type: "text", required: true, max: 200 });
  addSvc({ id: "text_svc_slug", name: "slug", type: "text", required: true, max: 100 });
  addSvc({ id: "text_svc_desc", name: "description", type: "text", required: false, max: 2000 });
  addSvc({ id: "text_svc_cat", name: "category", type: "text", required: false, max: 80 });
  addSvc({ id: "num_svc_price", name: "price", type: "number", required: false, min: 0 });
  addSvc({ id: "bool_svc_active", name: "is_active", type: "bool", required: false });
  addSvc({ id: "num_svc_sort", name: "sort_order", type: "number", required: false, min: 0 });
  services.listRule = "";
  services.viewRule = "";
  services.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary'";
  services.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary'";
  services.deleteRule = "@request.auth.role = 'admin'";
  app.save(services);

  // ---------- articles ----------
  let articles;
  try {
    articles = app.findCollectionByNameOrId("articles");
  } catch {
    articles = new Collection({
      id: "pbc_articles_hoomban",
      name: "articles",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'writer' || @request.auth.role = 'secretary'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'writer' || @request.auth.role = 'secretary'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          id: "text_art_id",
          name: "id",
          type: "text",
          primaryKey: true,
          required: true,
          autogeneratePattern: "[a-z0-9]{15}",
          min: 15,
          max: 15,
          pattern: "^[a-z0-9]+$"
        }
      ]
    });
    app.save(articles);
    articles = app.findCollectionByNameOrId("articles");
  }
  const addArt = (def) => {
    if (!articles.fields.getByName(def.name)) articles.fields.add(new Field(def));
  };
  addArt({ id: "text_art_title", name: "title", type: "text", required: true, max: 300 });
  addArt({ id: "text_art_slug", name: "slug", type: "text", required: true, max: 200 });
  addArt({ id: "text_art_excerpt", name: "excerpt", type: "text", required: false, max: 1000 });
  addArt({ id: "text_art_content", name: "content", type: "text", required: false, max: 20000 });
  addArt({ id: "text_art_source", name: "source_url", type: "url", required: false });
  addArt({ id: "bool_art_pub", name: "is_published", type: "bool", required: false });
  addArt({ id: "num_art_sort", name: "sort_order", type: "number", required: false, min: 0 });
  articles.listRule = "";
  articles.viewRule = "";
  app.save(articles);

  // ---------- testimonials ----------
  let testimonials;
  try {
    testimonials = app.findCollectionByNameOrId("testimonials");
  } catch {
    testimonials = new Collection({
      id: "pbc_testimonials_hb",
      name: "testimonials",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'secretary'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'secretary'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          id: "text_tm_id",
          name: "id",
          type: "text",
          primaryKey: true,
          required: true,
          autogeneratePattern: "[a-z0-9]{15}",
          min: 15,
          max: 15,
          pattern: "^[a-z0-9]+$"
        }
      ]
    });
    app.save(testimonials);
    testimonials = app.findCollectionByNameOrId("testimonials");
  }
  const addTm = (def) => {
    if (!testimonials.fields.getByName(def.name)) testimonials.fields.add(new Field(def));
  };
  addTm({ id: "text_tm_author", name: "author", type: "text", required: true, max: 120 });
  addTm({ id: "text_tm_source", name: "source", type: "text", required: false, max: 120 });
  addTm({ id: "num_tm_rating", name: "rating", type: "number", required: false, min: 0, max: 5 });
  addTm({ id: "text_tm_body", name: "body", type: "text", required: true, max: 2000 });
  addTm({ id: "bool_tm_pub", name: "is_published", type: "bool", required: false });
  addTm({ id: "num_tm_sort", name: "sort_order", type: "number", required: false, min: 0 });
  testimonials.listRule = "";
  testimonials.viewRule = "";
  app.save(testimonials);

  // helpers
  function ensureStaff(mobile, role, name, active = true) {
    let existing;
    try {
      existing = app.findFirstRecordByFilter("staff_registry", `mobile = "${mobile}"`);
    } catch {
      existing = null;
    }
    if (existing) {
      existing.set("role", role);
      existing.set("name", name);
      existing.set("active", active);
      app.save(existing);
      return existing;
    }
    const rec = new Record(staff);
    rec.set("mobile", mobile);
    rec.set("role", role);
    rec.set("name", name);
    rec.set("active", active);
    app.save(rec);
    return rec;
  }

  function ensureUser(mobile, role, name) {
    const email = `user_${mobile}@hoomban.com`;
    let user;
    try {
      user = app.findAuthRecordByEmail("users", email);
    } catch {
      user = null;
    }
    if (user) {
      user.set("name", name);
      user.set("role", role);
      user.set("mobile", mobile);
      user.set("emailVisibility", true);
      app.save(user);
      return user;
    }
    user = new Record(users);
    user.set("email", email);
    user.set("emailVisibility", true);
    user.set("password", DEMO_PASSWORD);
    user.set("passwordConfirm", DEMO_PASSWORD);
    user.set("name", name);
    user.set("role", role);
    user.set("mobile", mobile);
    user.set("verified", true);
    app.save(user);
    return user;
  }

  function ensureDoctor(user, opts) {
    let doc;
    try {
      doc = app.findFirstRecordByFilter("doctors", `user = "${user.id}"`);
    } catch {
      doc = null;
    }
    if (!doc) {
      doc = new Record(doctors);
      doc.set("user", user.id);
    }
    doc.set("display_name", opts.name);
    doc.set("bio", opts.bio);
    doc.set("specialty", opts.specialty);
    doc.set("visit_fee", opts.fee);
    doc.set("slot_duration", opts.duration || 45);
    doc.set("working_days", weekdays);
    doc.set("is_active", opts.active !== false);
    doc.set("sort_order", opts.sort || 0);
    app.save(doc);
    return doc;
  }

  function ensureBySlug(collection, slugField, slug, data) {
    let rec;
    try {
      rec = app.findFirstRecordByFilter(collection.name, `${slugField} = "${slug}"`);
    } catch {
      rec = null;
    }
    if (!rec) rec = new Record(collection);
    for (const [k, v] of Object.entries(data)) rec.set(k, v);
    app.save(rec);
    return rec;
  }

  // Deactivate previous placeholder doctors (احمدی / محمدی)
  for (const mobile of ["09120000001", "09120000002"]) {
    ensureStaff(mobile, "doctor", "غیرفعال (قدیمی)", false);
    try {
      const u = app.findAuthRecordByEmail("users", `user_${mobile}@hoomban.com`);
      const doc = app.findFirstRecordByFilter("doctors", `user = "${u.id}"`);
      if (doc) {
        doc.set("is_active", false);
        app.save(doc);
      }
    } catch {
      /* skip */
    }
  }

  // Real specialists from hoomban.com (photos later)
  const specialists = [
    { mobile: "09121000001", name: "بهناز غلامی", specialty: "روانشناس", bio: "روانشناس — کلینیک هومبان اراک", fee: 950000, sort: 1 },
    { mobile: "09121000002", name: "ناهید براتی", specialty: "روانشناس", bio: "روانشناس — کلینیک هومبان اراک", fee: 950000, sort: 2 },
    { mobile: "09121000003", name: "ثمین حسنی", specialty: "اختلالات خلقی و فردی", bio: "تخصص در اختلالات خلقی و فردی", fee: 950000, sort: 3 },
    { mobile: "09121000004", name: "سپیده عباسی", specialty: "رواندرمانگر", bio: "رواندرمانگر — کلینیک هومبان اراک", fee: 950000, sort: 4 },
    { mobile: "09121000005", name: "پرویز ابراهیمی", specialty: "توانبخشی شناختی", bio: "متخصص توانبخشی شناختی", fee: 950000, sort: 5 },
    { mobile: "09121000006", name: "محمدرضا خوانساری", specialty: "روانشناس", bio: "روانشناس — کلینیک هومبان اراک", fee: 950000, sort: 6 },
    { mobile: "09121000007", name: "علیرضا ملکی تبار", specialty: "مشاوره خانواده", bio: "مشاوره خانواده", fee: 950000, sort: 7 },
    { mobile: "09121000008", name: "الهام عظیمیان", specialty: "روانشناس خانواده", bio: "روانشناس خانواده", fee: 950000, sort: 8 },
    { mobile: "09121000009", name: "سعیده قاسمی", specialty: "مشاوره نوجوان و تحصیلی", bio: "مشاوره نوجوان و تحصیلی", fee: 950000, sort: 9 }
  ];

  for (const s of specialists) {
    ensureStaff(s.mobile, "doctor", s.name, true);
    const u = ensureUser(s.mobile, "doctor", s.name);
    ensureDoctor(u, s);
  }

  ensureStaff("09120000003", "secretary", "منشی کلینیک", true);
  ensureUser("09120000003", "secretary", "منشی کلینیک");
  ensureUser("09121111111", "patient", "بیمار آزمایشی");

  // Services / products from live site
  const serviceRows = [
    {
      slug: "qeeg",
      title: "نقشه مغزی",
      price: 2270000,
      category: "نوروتراپی",
      description: "نقشه مغزی (QEEG) برای بررسی کمی فعالیت مغز و طراحی درمان شخصی‌سازی‌شده.",
      sort_order: 1
    },
    {
      slug: "tdcs",
      title: "هر جلسه TDCS",
      price: 647000,
      category: "نوروتراپی",
      description: "تحریک الکتریکی مستقیم مغز (tDCS) — روش غیرتهاجمی نورومدولاسیون.",
      sort_order: 2
    },
    {
      slug: "therapy-45",
      title: "۴۵ دقیقه مشاوره و روان‌درمانی",
      price: 950000,
      category: "روان‌درمانی",
      description: "جلسه مشاوره و روان‌درمانی حضوری یا آنلاین.",
      sort_order: 3
    },
    {
      slug: "loreta-neurofeedback",
      title: "لورتا نوروفیدبک و بایوفیدبک",
      price: 1370000,
      category: "نوروتراپی",
      description: "جلسه لورتا نوروفیدبک و بایوفیدبک برای تنظیم الگوهای فعالیت مغزی.",
      sort_order: 4
    },
    {
      slug: "vagus-stimulation",
      title: "تحریک عصب واگ",
      price: 647000,
      category: "نوروتراپی",
      description: "تحریک غیرتهاجمی عصب واگ (tVNS/nVNS).",
      sort_order: 5
    },
    {
      slug: "rtms",
      title: "هر جلسه RTMS",
      price: 970000,
      category: "نوروتراپی",
      description: "تحریک مغناطیسی مکرر مغز (rTMS).",
      sort_order: 6
    },
    {
      slug: "brain-laser",
      title: "لیزر مغزی",
      price: 1170000,
      category: "نوروتراپی",
      description: "فتوبیومادولیشن / لیزر درمانی کم‌توان مغز.",
      sort_order: 7
    },
    {
      slug: "psychotherapy",
      title: "روان‌درمانی",
      price: 950000,
      category: "خدمات اصلی",
      description:
        "روان‌درمانی فرایندی تخصصی است که در آن فرد با کمک درمانگر آموزش‌دیده درباره افکار، احساسات و رفتارهای خود صحبت می‌کند تا الگوهای ناسالم را بشناسد و تغییر دهد.",
      sort_order: 10
    },
    {
      slug: "neurotherapy",
      title: "نوروتراپی",
      price: 0,
      category: "خدمات اصلی",
      description:
        "نوروتراپی با تمرکز بر عملکرد مغز و تنظیم فعالیت‌های عصبی به بهبود اضطراب، بیش‌فعالی و اختلالات خلقی کمک می‌کند.",
      sort_order: 11
    },
    {
      slug: "psychoanalysis",
      title: "روانکاوی",
      price: 950000,
      category: "خدمات اصلی",
      description:
        "روانکاوی بر نقش ناهشیار در شکل‌گیری افکار و رفتارها تأکید دارد و با بررسی تجربه‌های کودکی و تعارض‌های درونی ریشه مشکلات را شناسایی می‌کند.",
      sort_order: 12
    }
  ];

  for (const row of serviceRows) {
    ensureBySlug(services, "slug", row.slug, { ...row, is_active: true });
  }

  // Articles (public excerpts from WP)
  const articleRows = [
    {
      slug: "نقش-رواندرمانی-و-روانکاوی",
      title: "نقش روان‌درمانی و روانکاوی در بهبود اختلالات روانی",
      excerpt:
        "اختلالات روانی یکی از مهم‌ترین چالش‌های سلامت عمومی هستند؛ از اضطراب و افسردگی تا اختلالات شخصیت و تروما.",
      source_url: "https://hoomban.com/?p=6246",
      sort_order: 1
    },
    {
      slug: "احساس-غربت-در-جهان",
      title: "احساس غربت در جهان؛ روایتی از دلِ یک روانشناس",
      excerpt: "نویسنده: الهام عظیمیان — روایتی درباره حس تعلق‌نداشتن به دنیا در اتاق درمان.",
      source_url: "https://hoomban.com/?p=6224",
      sort_order: 2
    },
    {
      slug: "اضطراب-مرگ-و-میل-به-جاودانگی",
      title: "اضطراب مرگ و میل به جاودانگی: نگاه یک روانشناس همدل",
      excerpt: "نویسنده: الهام عظیمیان — درباره آگاهی از پایان و اضطراب وجودی.",
      source_url: "https://hoomban.com/?p=6223",
      sort_order: 3
    },
    {
      slug: "qeeg",
      title: "نقشه مغزی (QEEG) چیست؟",
      excerpt:
        "نقشه مغزی یا Quantitative Electroencephalography یکی از فناوری‌های پیشرفته در علوم اعصاب برای تحلیل کمی سیگنال‌های EEG است.",
      source_url: "https://hoomban.com/?p=95",
      sort_order: 4
    },
    {
      slug: "neurotherapy",
      title: "نوروتراپی چیست؟",
      excerpt:
        "نوروتراپی مجموعه‌ای از روش‌های غیرتهاجمی مبتنی بر تعدیل فعالیت مغز مانند نوروفیدبک و تحریک مغزی است.",
      source_url: "https://hoomban.com/?p=94",
      sort_order: 5
    },
    {
      slug: "photobiomodulation",
      title: "فتوبیومدولیشن مغزی چیست؟",
      excerpt:
        "فتوبیومدولیشن مغزی (tPBM) درمان غیرتهاجمی با نور طیف قرمز تا نزدیک‌به‌فروسرخ برای تحریک سلول‌های مغزی است.",
      source_url: "https://hoomban.com/?p=93",
      sort_order: 6
    },
    {
      slug: "rtms",
      title: "RTMS چیست؟",
      excerpt:
        "تحریک مغناطیسی مکرر مغز (rTMS) با میدان مغناطیسی پالسی فعالیت نورون‌های قشر مغز را تنظیم می‌کند.",
      source_url: "https://hoomban.com/?p=5826",
      sort_order: 7
    },
    {
      slug: "tdcs",
      title: "کاربرد TDCS در درمان اختلالات روانپزشکی",
      excerpt:
        "tDCS با اعمال جریان الکتریکی ضعیف از طریق الکترودهای پوست سر، فعالیت نورون‌ها را تعدیل می‌کند.",
      source_url: "https://hoomban.com/?p=5862",
      sort_order: 8
    },
    {
      slug: "bipolar",
      title: "اختلال افسردگی دوقطبی چیست؟",
      excerpt:
        "اختلال دوقطبی با نوسانات شدید خلقی بین افسردگی و شیدایی مشخص می‌شود و نیاز به درمان طولانی‌مدت دارد.",
      source_url: "https://hoomban.com/?p=5864",
      sort_order: 9
    },
    {
      slug: "vagus",
      title: "تحریک غیرتهاجمی عصب واگ چیست؟",
      excerpt: "tVNS/nVNS روش نورومدولاسیون بدون جراحی برای فعال‌سازی عصب واگ است.",
      source_url: "https://hoomban.com/?p=5898",
      sort_order: 10
    },
    {
      slug: "neurofeedback",
      title: "نوروفیدبک چیست؟",
      excerpt: "نوروفیدبک با بازخورد فعالیت مغزی به افراد کمک می‌کند الگوهای مغز خود را تنظیم کنند.",
      source_url: "https://hoomban.com/?p=5897",
      sort_order: 11
    },
    {
      slug: "adhd",
      title: "اختلال ADHD چیست؟",
      excerpt: "ADHD اختلال عصبی-رشدی با الگوهای پایدار بی‌توجهی، بیش‌فعالی و تکانشگری است.",
      source_url: "https://hoomban.com/?p=5896",
      sort_order: 12
    }
  ];

  for (const row of articleRows) {
    ensureBySlug(articles, "slug", row.slug, {
      ...row,
      content: row.excerpt,
      is_published: true
    });
  }

  // Testimonials from live site
  const tmRows = [
    {
      author: "سامان",
      source: "دکترتو",
      rating: 5,
      body: "بهترین روانشناس. پنیک داشتم ۶ ماه از خونه بیرون نرفتم. نقشه مغزی گرفت با دستگاه تحریک عصب واگ خیلی خوب شدم. درمان شناختی رفتاری هم گرفتم.",
      sort_order: 1
    },
    {
      author: "سپاهان",
      source: "دکترتو",
      rating: 5,
      body: "دوقطبی و شخصیت مرزی. TDCS حدود ۳۰ جلسه و نقشه مغزی. تشخیص و درمان فوق‌العاده. روانکاوی هم می‌شم.",
      sort_order: 2
    },
    {
      author: "شیرین",
      source: "دکترتو",
      rating: 5,
      body: "از ایرلند مشاوره آنلاین واتساپی با دکتر خوانساری داشتم. بسیار باسواد و علمی هستند؛ چهار ماه روان‌درمانی و حالم بهتر شده.",
      sort_order: 3
    },
    {
      author: "کاربر دکتریاب",
      source: "دکتریاب",
      rating: 5,
      body: "سپاس فراوان؛ محترم و علمی کمک‌رسان بودند. درمان و بهبودی خود را مدیون آقای دکتر خوانساری هستم.",
      sort_order: 4
    },
    {
      author: "کاربر دکتریاب",
      source: "دکتریاب",
      rating: 5,
      body: "آنلاین‌تراپی دارم؛ مشکلات را درست تشخیص دادند و راهکارها عملی است. از معدود روانشناس‌هایی که دوقطبی را درمان می‌کنند.",
      sort_order: 5
    }
  ];

  for (const row of tmRows) {
    let existing;
    try {
      existing = app.findFirstRecordByFilter(
        "testimonials",
        `author = "${row.author}" && sort_order = ${row.sort_order}`
      );
    } catch {
      existing = null;
    }
    const rec = existing || new Record(testimonials);
    rec.set("author", row.author);
    rec.set("source", row.source);
    rec.set("rating", row.rating);
    rec.set("body", row.body);
    rec.set("sort_order", row.sort_order);
    rec.set("is_published", true);
    app.save(rec);
  }
}, (app) => {});
