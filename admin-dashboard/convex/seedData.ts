// convex/seedData.ts
import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/**
 * Helper to retrieve a FilterOption ID by its name and parent,
 * used internally by seedCommunityPosts.
 */
async function getFilterOptionIdByName(
  ctx: any, // Use `any` for `ctx` to avoid circular dependency
  name: string,
  parentId: Id<"FilterOption"> | null = null,
  type?:
    | "qualification"
    | "category"
    | "sector"
    | "subSector"
    | "branch"
    | "role"
): Promise<Id<"FilterOption"> | undefined> {
  let query = ctx.db
    .query("FilterOption")
    .filter((q: any) => q.eq(q.field("name"), name));

  if (parentId === null) {
    query = query.filter((q: any) =>
      q.eq(q.field("parentId"), undefined)
    ); // Root level check
  } else if (parentId !== undefined) {
    query = query.filter((q: any) =>
      q.eq(q.field("parentId"), parentId)
    );
  }

  if (type) {
    query = query.filter((q: any) =>
      q.eq(q.field("type"), type)
    );
  }

  const option = await query.first();
  return option?._id;
}

/**
 * Seeds the FilterOption table with a hierarchical structure AND descriptive content.
 * This mutation will clear existing FilterOptions before re-seeding.
 */
export const seedFilterOptions = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("--- Starting Filter Options Seeding ---");

    // Clear existing filter options (simple approach without index dependencies)
    const existingOptions = await ctx.db
      .query("FilterOption")
      .collect();
    for (const option of existingOptions) {
      await ctx.db.delete(option._id);
    }
    console.log(
      `Cleared ${existingOptions.length} existing filter options and associated data.`
    );

    const createdFilterIds: {
      [key: string]: Id<"FilterOption">;
    } = {};

    /**
     * Helper function to insert a filter option with its content into the database.
     */
    const insertFilterOption = async (
      manualId: string,
      name: string,
      type:
        | "qualification"
        | "category"
        | "sector"
        | "subSector"
        | "branch"
        | "role",
      parentManualId?: string | null,
      content?: {
        description?: string;
        requirements?: string;
        avgSalary?: string;
        relevantExams?: string;
        image?: string; // New field for path images
      }
    ): Promise<void> => {
      const parentConvexId = parentManualId
        ? createdFilterIds[parentManualId]
        : null;

      if (
        parentManualId !== null &&
        parentManualId !== undefined &&
        !parentConvexId
      ) {
        console.error(
          `ERROR: Parent ID '${parentManualId}' not found for '${name}' (manualId: ${manualId}). Skipping.`
        );
        return;
      }

      const newId = await ctx.db.insert("FilterOption", {
        name,
        type,
        parentId: parentConvexId || undefined,
        description: content?.description,
        requirements: content?.requirements,
        avgSalary: content?.avgSalary,
        relevantExams: content?.relevantExams,
        image: content?.image,
        likes: 0,
        comments: 0,
        isActive: true,
      });
      createdFilterIds[manualId] = newId;
      console.log(
        `  CREATED: ${type} - "${name}" (Manual ID: ${manualId} -> Convex ID: ${newId})`
      );
    };

    // --- 1. Qualification Levels (Root Nodes) ---
    await insertFilterOption(
      "qual_grad",
      "Graduation",
      "qualification",
      null,
      {
        description:
          "This path explores career options suitable for graduates across various disciplines.",
        requirements:
          "A Bachelor's degree (B.A., B.Sc., B.Tech, B.Com, etc.) from a recognized university.",
        relevantExams:
          "UPSC CSE, SSC CGL, CAT, GATE, Bank PO Exams",
        image:
          "https://via.placeholder.com/400x200/4CAF50/FFFFFF?text=Graduation",
      }
    );
    await insertFilterOption(
      "qual_12th",
      "12th Standard",
      "qualification",
      null,
      {
        description:
          "Opportunities available directly after completing 12th Standard education.",
        requirements:
          "Successful completion of 12th Standard (any stream).",
        relevantExams:
          "NDA, SSC CHSL, Railway Group D, State Police Exams",
        image:
          "https://via.placeholder.com/400x200/2196F3/FFFFFF?text=12th+Standard",
      }
    );
    await insertFilterOption(
      "qual_10th",
      "10th Standard",
      "qualification",
      null,
      {
        description:
          "Basic entry-level careers and vocational training options for 10th pass students.",
        requirements:
          "Successful completion of 10th Standard.",
        relevantExams:
          "SSC MTS, Railway Group D, ITI Entrance Exams",
        image:
          "https://via.placeholder.com/400x200/FFC107/000000?text=10th+Standard",
      }
    );
    await insertFilterOption(
      "qual_diploma",
      "Diploma",
      "qualification",
      null,
      {
        description:
          "Career paths for those with a polytechnic or other diploma qualifications.",
        requirements:
          "Completion of a diploma course (e.g., Engineering Diploma).",
        relevantExams:
          "JE Exams, PSU Diploma Trainee Exams",
        image:
          "https://via.placeholder.com/400x200/9C27B0/FFFFFF?text=Diploma",
      }
    );

    // --- 2. Job Categories (Under 'Graduation' for this example) ---
    await insertFilterOption(
      "cat_govt",
      "Government Jobs",
      "category",
      "qual_grad",
      {
        description:
          "Explore stable and prestigious career opportunities in various government sectors at central and state levels.",
        image:
          "https://via.placeholder.com/400x200/607D8B/FFFFFF?text=Government+Jobs",
      }
    );
    await insertFilterOption(
      "cat_private",
      "Private Jobs",
      "category",
      "qual_grad",
      {
        description:
          "Dive into the dynamic and growth-oriented private sector, offering diverse roles across industries.",
        image:
          "https://via.placeholder.com/400x200/FF9800/FFFFFF?text=Private+Jobs",
      }
    );
    await insertFilterOption(
      "cat_business",
      "Business & Entrepreneurship",
      "category",
      "qual_grad",
      {
        description:
          "Learn about starting your own venture, becoming a freelancer, or joining startup ecosystems.",
        image:
          "https://via.placeholder.com/400x200/795548/FFFFFF?text=Entrepreneurship",
      }
    );
    await insertFilterOption(
      "cat_sports",
      "Sports & Fitness",
      "category",
      "qual_grad",
      {
        description:
          "Careers related to professional sports, coaching, sports management, and fitness industries.",
        image:
          "https://via.placeholder.com/400x200/E91E63/FFFFFF?text=Sports",
      }
    );
    await insertFilterOption(
      "cat_agri",
      "Agriculture & Allied",
      "category",
      "qual_grad",
      {
        description:
          "Opportunities in farming, agricultural research, food processing, and related rural development sectors.",
        image:
          "https://via.placeholder.com/400x200/8BC34A/FFFFFF?text=Agriculture",
      }
    );

    // --- 3. Sectors (Under Categories) ---
    // Under Government Jobs
    await insertFilterOption(
      "sec_defence",
      "Defence Services",
      "sector",
      "cat_govt",
      {
        description:
          "Serve the nation in the Indian Army, Navy, Air Force, or various Paramilitary Forces.",
        relevantExams:
          "CDS, AFCAT, UPSC CAPF, NDA (for 12th qual, but roles here for grad)",
        image:
          "https://via.placeholder.com/400x200/00008B/FFFFFF?text=Defence",
      }
    );
    await insertFilterOption(
      "sec_banking_govt",
      "Government Banking",
      "sector",
      "cat_govt",
      {
        description:
          "Careers in public sector banks like SBI, PNB, Bank of Baroda, and regulatory bodies.",
        relevantExams:
          "IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B",
        image:
          "https://via.placeholder.com/400x200/26A69A/FFFFFF?text=Govt+Banking",
      }
    );
    await insertFilterOption(
      "sec_railways",
      "Indian Railways",
      "sector",
      "cat_govt",
      {
        description:
          "Diverse roles in the largest employer in India, from engineering to operations.",
        relevantExams: "RRB NTPC, RRB JE, RRB Group D",
        image:
          "https://via.placeholder.com/400x200/FF5722/FFFFFF?text=Indian+Railways",
      }
    );
    await insertFilterOption(
      "sec_civil_svc",
      "Civil Services",
      "sector",
      "cat_govt",
      {
        description:
          "Become an administrator, police officer, or diplomat through prestigious civil service examinations.",
        relevantExams:
          "UPSC Civil Services Exam (CSE), State PSC Exams",
        image:
          "https://via.placeholder.com/400x200/5E35B1/FFFFFF?text=Civil+Services",
      }
    );

    // Under Private Jobs
    await insertFilterOption(
      "sec_it_software",
      "IT & Software",
      "sector",
      "cat_private",
      {
        description:
          "Explore the fast-paced world of Information Technology, including software development, data, and cybersecurity.",
        image:
          "https://via.placeholder.com/400x200/008080/FFFFFF?text=IT+Software",
      }
    );
    await insertFilterOption(
      "sec_manufacturing",
      "Manufacturing",
      "sector",
      "cat_private",
      {
        description:
          "Careers in product design, production, quality control, and supply chain within traditional and advanced manufacturing.",
        image:
          "https://via.placeholder.com/400x200/757575/FFFFFF?text=Manufacturing",
      }
    );
    await insertFilterOption(
      "sec_finance_private",
      "Private Finance",
      "sector",
      "cat_private",
      {
        description:
          "Opportunities in private banks, investment firms, wealth management, and fintech startups.",
        image:
          "https://via.placeholder.com/400x200/3F51B5/FFFFFF?text=Private+Finance",
      }
    );
    await insertFilterOption(
      "sec_retail",
      "Retail & E-commerce",
      "sector",
      "cat_private",
      {
        description:
          "Roles in sales, marketing, operations, logistics, and customer experience in online and offline retail.",
        image:
          "https://via.placeholder.com/400x200/FFEB3B/000000?text=Retail",
      }
    );

    // --- 4. Sub-Sectors (Under Sectors) ---
    // Under Defence Services
    await insertFilterOption(
      "sub_army",
      "Indian Army",
      "subSector",
      "sec_defence",
      {
        description:
          "Life as an officer or jawan in the Indian Army, focusing on land-based operations and defense.",
        image:
          "https://via.placeholder.com/400x200/0D47A1/FFFFFF?text=Indian+Army",
      }
    );
    await insertFilterOption(
      "sub_navy",
      "Indian Navy",
      "subSector",
      "sec_defence",
      {
        description:
          "Careers in the naval forces, involving maritime operations, engineering, and logistics.",
        image:
          "https://via.placeholder.com/400x200/1565C0/FFFFFF?text=Indian+Navy",
      }
    );
    await insertFilterOption(
      "sub_airforce",
      "Indian Air Force",
      "subSector",
      "sec_defence",
      {
        description:
          "Opportunities in aviation, ground duties, and technical roles within the Indian Air Force.",
        image:
          "https://via.placeholder.com/400x200/1976D2/FFFFFF?text=Indian+Air+Force",
      }
    );
    await insertFilterOption(
      "sub_paramil",
      "Paramilitary Forces",
      "subSector",
      "sec_defence",
      {
        description:
          "Roles in central armed police forces like CRPF, BSF, CISF, ITBP, and SSB, maintaining internal security.",
        image:
          "https://via.placeholder.com/400x200/2196F3/FFFFFF?text=Paramilitary",
      }
    );

    // Under IT & Software
    await insertFilterOption(
      "sub_it_soft_dev",
      "Software Development",
      "subSector",
      "sec_it_software",
      {
        description:
          "The core of IT, focusing on designing, coding, and maintaining software applications.",
        image:
          "https://via.placeholder.com/400x200/4CAF50/FFFFFF?text=Software+Dev",
      }
    );
    await insertFilterOption(
      "sub_it_data_sci",
      "Data Science & AI",
      "subSector",
      "sec_it_software",
      {
        description:
          "Using data to derive insights, build predictive models, and develop artificial intelligence solutions.",
        image:
          "https://via.placeholder.com/400x200/8BC34A/FFFFFF?text=Data+Science",
      }
    );
    await insertFilterOption(
      "sub_it_cyb_sec",
      "Cybersecurity",
      "subSector",
      "sec_it_software",
      {
        description:
          "Protecting computer systems and networks from digital attacks and unauthorized access.",
        image:
          "https://via.placeholder.com/400x200/FFEB3B/000000?text=Cybersecurity",
      }
    );

    // --- 5. Branches (Under Sub-Sectors) ---
    // Under Indian Navy
    await insertFilterOption(
      "branch_navy_exec",
      "Executive Branch",
      "branch",
      "sub_navy",
      {
        description:
          "Officers responsible for commanding ships, navigation, weapons systems, and overall operations.",
        requirements:
          "Graduate in any stream or specific engineering branches (depending on entry).",
      }
    );
    await insertFilterOption(
      "branch_navy_engg",
      "Engineering Branch",
      "branch",
      "sub_navy",
      {
        description:
          "Maintaining and operating the propulsion systems, machinery, and technical aspects of naval vessels.",
        requirements:
          "B.Tech/B.E. in Mechanical, Marine, Electrical, or equivalent disciplines.",
      }
    );

    // Under Software Development
    await insertFilterOption(
      "branch_soft_dev_front",
      "Frontend Development",
      "branch",
      "sub_it_soft_dev",
      {
        description:
          "Building the user-facing part of websites and applications that users interact with directly.",
        requirements:
          "Strong grasp of HTML, CSS, JavaScript, and frameworks like React, Vue, or Angular.",
      }
    );
    await insertFilterOption(
      "branch_soft_dev_back",
      "Backend Development",
      "branch",
      "sub_it_soft_dev",
      {
        description:
          "Developing the server-side logic, databases, and APIs that power applications.",
        requirements:
          "Proficiency in languages like Python, Java, Node.js, and understanding of databases.",
      }
    );
    await insertFilterOption(
      "branch_soft_dev_full",
      "Full Stack Development",
      "branch",
      "sub_it_soft_dev",
      {
        description:
          "Combining both frontend and backend skills to build complete web applications from end to end.",
        requirements:
          "A blend of frontend (HTML, CSS, JS, React/Vue) and backend (Node.js/Python/Java, databases) expertise.",
      }
    );

    // --- 6. Roles (Under Branches - the deepest level for specific career exploration) ---
    // Under Navy Executive Branch
    await insertFilterOption(
      "role_navy_pilot",
      "SSC Pilot (Navy)",
      "role",
      "branch_navy_exec",
      {
        description:
          "Commissioned officers in the Indian Navy responsible for flying naval aircraft from carriers or land bases.",
        requirements:
          "Graduation with Physics & Math at 10+2 level or B.E./B.Tech. Age: 20-24 years.",
        avgSalary:
          "Approx. ₹56,100 - ₹1,77,500 per month (Pay Level 10)",
        relevantExams: "AFCAT, CDS (for flying branch)",
        image:
          "https://via.placeholder.com/400x200/1565C0/FFFFFF?text=Navy+Pilot",
      }
    );
    await insertFilterOption(
      "role_navy_observer",
      "SSC Observer (Navy)",
      "role",
      "branch_navy_exec",
      {
        description:
          "Naval officers who operate advanced sensors and weapons systems on maritime reconnaissance aircraft for surveillance and anti-submarine warfare.",
        requirements:
          "Graduation with Physics & Math at 10+2 level or B.E./B.Tech. Age: 19-24 years.",
        avgSalary: "Approx. ₹56,100 - ₹1,77,500 per month",
        relevantExams: "AFCAT",
        image:
          "https://via.placeholder.com/400x200/1565C0/FFFFFF?text=Navy+Observer",
      }
    );
    await insertFilterOption(
      "role_navy_logistics",
      "SSC Logistics (Navy)",
      "role",
      "branch_navy_exec",
      {
        description:
          "Officers managing supply chain, inventory, and procurement for the Indian Navy, ensuring smooth operations.",
        requirements:
          "B.Com/B.Sc/B.A. (various streams) or B.E./B.Tech. Age: 19-25 years.",
        avgSalary: "Approx. ₹56,100 - ₹1,77,500 per month",
        relevantExams: "Indian Navy SSC Entry",
        image:
          "https://via.placeholder.com/400x200/1565C0/FFFFFF?text=Navy+Logistics",
      }
    );

    // Under Frontend Development
    await insertFilterOption(
      "role_react_dev",
      "React Developer",
      "role",
      "branch_soft_dev_front",
      {
        description:
          "Specializes in building dynamic and responsive user interfaces using the React.js library for web and mobile applications.",
        requirements:
          "Proficiency in JavaScript (ES6+), React.js, Redux/Context API, HTML, CSS, Git, RESTful APIs. Knowledge of UI/UX principles is a plus.",
        avgSalary:
          "Fresher: 3-6 LPA, Experienced: 6-15+ LPA",
        relevantExams: "N/A (Portfolio & Skills-based)",
        image:
          "https://via.placeholder.com/400x200/000000/61DAFB?text=React+Dev",
      }
    );
    await insertFilterOption(
      "role_vue_dev",
      "Vue.js Developer",
      "role",
      "branch_soft_dev_front",
      {
        description:
          "Focuses on creating intuitive user interfaces with the Vue.js progressive framework, known for its simplicity and flexibility.",
        requirements:
          "Strong understanding of Vue.js, Vuex/Pinia, JavaScript, HTML, CSS, API integration. Experience with Nuxt.js is beneficial.",
        avgSalary:
          "Fresher: 3-6 LPA, Experienced: 6-14+ LPA",
        relevantExams: "N/A (Portfolio & Skills-based)",
        image:
          "https://via.placeholder.com/400x200/42B883/FFFFFF?text=Vue+Dev",
      }
    );
    await insertFilterOption(
      "role_angular_dev",
      "Angular Developer",
      "role",
      "branch_soft_dev_front",
      {
        description:
          "Builds robust single-page applications and complex enterprise-level frontends using the Angular framework.",
        requirements:
          "Expertise in TypeScript, Angular (2+), RxJS, HTML, CSS (SCSS), unit testing, and strong problem-solving skills.",
        avgSalary:
          "Fresher: 3.5-7 LPA, Experienced: 7-16+ LPA",
        relevantExams: "N/A (Portfolio & Skills-based)",
        image:
          "https://via.placeholder.com/400x200/DD0031/FFFFFF?text=Angular+Dev",
      }
    );
    await insertFilterOption(
      "role_ui_ux_designer",
      "UI/UX Designer",
      "role",
      "branch_soft_dev_front",
      {
        description:
          "Designs intuitive and aesthetically pleasing user interfaces (UI) and ensures a seamless user experience (UX) for digital products.",
        requirements:
          "Proficiency in design tools (Figma, Adobe XD, Sketch), understanding of user research, wireframing, prototyping, and visual design principles. Strong portfolio is key.",
        avgSalary:
          "Fresher: 2.5-5 LPA, Experienced: 5-12+ LPA",
        relevantExams: "N/A (Portfolio & Portfolio-based)",
        image:
          "https://via.placeholder.com/400x200/F06292/FFFFFF?text=UI%2FUX+Designer",
      }
    );

    // Under Backend Development
    await insertFilterOption(
      "role_nodejs_dev",
      "Node.js Developer",
      "role",
      "branch_soft_dev_back",
      {
        description:
          "Develops scalable, high-performance server-side applications using Node.js and its ecosystem (Express, NestJS).",
        requirements:
          "Strong JavaScript/TypeScript, Node.js, Express/NestJS, RESTful APIs, database (SQL/NoSQL) knowledge. Microservices experience is a plus.",
        avgSalary:
          "Fresher: 4-7 LPA, Experienced: 7-18+ LPA",
        relevantExams: "N/A (Skills-based)",
        image:
          "https://via.placeholder.com/400x200/339933/FFFFFF?text=Node.js+Dev",
      }
    );
    await insertFilterOption(
      "role_python_dev",
      "Python Developer",
      "role",
      "branch_soft_dev_back",
      {
        description:
          "Utilizes Python to build web applications, APIs, data processing pipelines, and automation scripts. Often used in web, data science, and AI.",
        requirements:
          "Proficiency in Python, frameworks like Django/Flask, REST APIs, database management, and version control. Familiarity with cloud platforms desirable.",
        avgSalary:
          "Fresher: 3.5-6.5 LPA, Experienced: 6-16+ LPA",
        relevantExams: "N/A (Skills-based)",
        image:
          "https://via.placeholder.com/400x200/3776AB/FFFFFF?text=Python+Dev",
      }
    );
    await insertFilterOption(
      "role_java_dev",
      "Java Developer",
      "role",
      "branch_soft_dev_back",
      {
        description:
          "Develops robust, scalable, and secure enterprise-level applications using Java and its extensive ecosystem (Spring Boot, Hibernate).",
        requirements:
          "Strong Java, Spring Boot, OOP concepts, data structures, algorithms, SQL databases. Experience with microservices and cloud is highly valued.",
        avgSalary:
          "Fresher: 4-7 LPA, Experienced: 7-20+ LPA",
        relevantExams:
          "Oracle Certified Professional (OCP)",
        image:
          "https://via.placeholder.com/400x200/007396/FFFFFF?text=Java+Dev",
      }
    );

    console.log("--- Filter Options Seeding Complete ---");
  },
});

/**
 * Seeds the communityPosts table with sample user-generated content.
 * This relies on seedFilterOptions having been run first.
 */
export const seedCommunityPosts = mutation({
  args: {},
  handler: async (ctx) => {
    console.log(
      "--- Starting Sample Community Posts Seeding ---"
    );

    console.log(
      "Clearing existing CommunityPost documents and associated likes, comments, savedContent..."
    );
    const existingPosts = await ctx.db
      .query("communityPosts")
      .collect();
    for (const post of existingPosts) {
      await ctx.db.delete(post._id);
    }
    console.log(
      `Cleared ${existingPosts.length} existing community posts and associated data.`
    );

    let adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isAdmin"), true))
      .first();
    if (!adminUser) {
      const dummyUserId = await ctx.db.insert("users", {
        clerkId: "clerk_admin_test_id_123",
        email: "admin@example.com",
        username: "adminuser",
        fullname: "Admin User",
        profileImage:
          "https://via.placeholder.com/150/0000FF/FFFFFF?text=ADMIN",
        isAdmin: true,
        createdAt: Date.now(),
      });
      adminUser = (await ctx.db.get(dummyUserId))!;
      console.log(
        `Created dummy admin user: ${adminUser.username}`
      );
    }
    const createdByUserId: Id<"users"> = adminUser._id;

    const reactDevId = await getFilterOptionIdByName(
      ctx,
      "React Developer",
      null,
      "role"
    );
    const pythonDevId = await getFilterOptionIdByName(
      ctx,
      "Python Developer",
      null,
      "role"
    );
    const navyPilotId = await getFilterOptionIdByName(
      ctx,
      "SSC Pilot (Navy)",
      null,
      "role"
    );
    const frontendDevBranchId =
      await getFilterOptionIdByName(
        ctx,
        "Frontend Development",
        null,
        "branch"
      );

    if (
      !reactDevId ||
      !pythonDevId ||
      !navyPilotId ||
      !frontendDevBranchId
    ) {
      console.error(
        "Missing critical FilterOption IDs for seeding community posts. Run seedFilterOptions first."
      );
      return;
    }

    await ctx.db.insert("communityPosts", {
      userId: createdByUserId,
      title: "Just landed my first React dev internship!",
      content:
        "Just landed my first React dev internship! Super excited. Any tips for a beginner on state management in large apps?",
      imageUrl:
        "https://via.placeholder.com/400x250/61DAFB/FFFFFF?text=React+Coding",
      linkedFilterOptionIds: [
        reactDevId,
        frontendDevBranchId,
      ],
      status: "published" as const,
      publishedAt: Date.now(),
      likes: 5,
      comments: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });
    console.log(
      "  Added 'React Dev Internship' community post."
    );

    await ctx.db.insert("communityPosts", {
      userId: createdByUserId,
      title: "Best Python frameworks for scalable APIs?",
      content:
        "What are the best frameworks for building scalable APIs with Python, besides Django and Flask?",
      imageUrl:
        "https://via.placeholder.com/400x250/4B0082/FFFFFF?text=Python+API",
      linkedFilterOptionIds: [pythonDevId],
      status: "published" as const,
      publishedAt: Date.now() - 3600 * 1000,
      likes: 8,
      comments: 4,
      createdAt: Date.now() - 3600 * 1000,
      updatedAt: Date.now() - 3600 * 1000,
      isActive: true,
    });
    console.log("  Added 'Python API' community post.");

    await ctx.db.insert("communityPosts", {
      userId: createdByUserId,
      title: "Why I chose Defence Services - Indian Navy",
      content:
        "The discipline and leadership skills learned in the armed forces are unparalleled. Highly recommend exploring this path if you seek purpose and growth! #IndianNavy #DefenceServices",
      imageUrl:
        "https://via.placeholder.com/400x250/00008B/FFFFFF?text=Motivation",
      linkedFilterOptionIds: [navyPilotId],
      status: "published" as const,
      publishedAt: Date.now() - 2 * 24 * 3600 * 1000,
      likes: 12,
      comments: 3,
      createdAt: Date.now() - 2 * 24 * 3600 * 1000,
      updatedAt: Date.now() - 2 * 24 * 3600 * 1000,
      isActive: true,
    });
    console.log(
      "  Added 'Defence Services Motivation' community post."
    );

    console.log(
      "--- Sample Community Posts Seeding Complete ---"
    );
  },
});
