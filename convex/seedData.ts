import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const seedFilters = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting Filter Options Seeding");

    // Clear existing options
    const existingOptions = await ctx.db
      .query("FilterOption")
      .collect();
    for (const option of existingOptions) {
      await ctx.db.delete(option._id);
    }
    console.log(
      `Cleared ${existingOptions.length} existing filter options`
    );

    const createdFilterIds: {
      [key: string]: Id<"FilterOption">;
    } = {};

    const createFilter = async (
      manualId: string,
      name: string,
      type:
        | "qualification"
        | "category"
        | "sector"
        | "subSector"
        | "branch"
        | "role",
      parentManualId?: string | null
    ): Promise<Id<"FilterOption"> | null> => {
      const parentConvexId = parentManualId
        ? createdFilterIds[parentManualId]
        : undefined;

      if (parentManualId && !parentConvexId) {
        console.error(
          `Missing parent '${parentManualId}' for '${name}'. Skipping.`
        );
        return null;
      }

      const newId = await ctx.db.insert("FilterOption", {
        name,
        type,
        parentId: parentConvexId,
        isActive: true,
      });
      createdFilterIds[manualId] = newId;
      console.log(
        `Created: ${type} - "${name}" (${manualId})`
      );
      return newId;
    };

    // 1. Qualification (roots)
    await createFilter(
      "qual_grad",
      "Graduation",
      "qualification",
      null
    );
    await createFilter(
      "qual_12th",
      "12th Standard",
      "qualification",
      null
    );
    await createFilter(
      "qual_10th",
      "10th Standard",
      "qualification",
      null
    );
    await createFilter(
      "qual_diploma",
      "Diploma",
      "qualification",
      null
    );

    // 2. Categories (under Graduation)
    await createFilter(
      "cat_govt",
      "Government Jobs",
      "category",
      "qual_grad"
    );
    await createFilter(
      "cat_private",
      "Private Jobs",
      "category",
      "qual_grad"
    );
    await createFilter(
      "cat_business",
      "Business & Entrepreneurship",
      "category",
      "qual_grad"
    );
    await createFilter(
      "cat_sports",
      "Sports & Fitness",
      "category",
      "qual_grad"
    );
    await createFilter(
      "cat_agri",
      "Agriculture & Allied",
      "category",
      "qual_grad"
    );

    // 3. Sectors
    await createFilter(
      "sec_defence",
      "Defence Services",
      "sector",
      "cat_govt"
    );
    await createFilter(
      "sec_banking_govt",
      "Government Banking",
      "sector",
      "cat_govt"
    );
    await createFilter(
      "sec_railways",
      "Indian Railways",
      "sector",
      "cat_govt"
    );
    await createFilter(
      "sec_civil_svc",
      "Civil Services",
      "sector",
      "cat_govt"
    );
    await createFilter(
      "sec_it_software",
      "IT & Software",
      "sector",
      "cat_private"
    );
    await createFilter(
      "sec_manufacturing",
      "Manufacturing",
      "sector",
      "cat_private"
    );
    await createFilter(
      "sec_finance_private",
      "Private Finance",
      "sector",
      "cat_private"
    );
    await createFilter(
      "sec_retail",
      "Retail & E-commerce",
      "sector",
      "cat_private"
    );

    // 4. Sub-sectors
    await createFilter(
      "sub_army",
      "Indian Army",
      "subSector",
      "sec_defence"
    );
    await createFilter(
      "sub_navy",
      "Indian Navy",
      "subSector",
      "sec_defence"
    );
    await createFilter(
      "sub_airforce",
      "Indian Air Force",
      "subSector",
      "sec_defence"
    );
    await createFilter(
      "sub_paramil",
      "Paramilitary Forces",
      "subSector",
      "sec_defence"
    );
    await createFilter(
      "sub_it_soft_dev",
      "Software Development",
      "subSector",
      "sec_it_software"
    );
    await createFilter(
      "sub_it_data_sci",
      "Data Science & AI",
      "subSector",
      "sec_it_software"
    );
    await createFilter(
      "sub_it_cyb_sec",
      "Cybersecurity",
      "subSector",
      "sec_it_software"
    );

    // 5. Branches
    await createFilter(
      "branch_navy_exec",
      "Executive Branch",
      "branch",
      "sub_navy"
    );
    await createFilter(
      "branch_navy_engg",
      "Engineering Branch",
      "branch",
      "sub_navy"
    );
    await createFilter(
      "branch_soft_dev_front",
      "Frontend Development",
      "branch",
      "sub_it_soft_dev"
    );
    await createFilter(
      "branch_soft_dev_back",
      "Backend Development",
      "branch",
      "sub_it_soft_dev"
    );
    await createFilter(
      "branch_soft_dev_full",
      "Full Stack Development",
      "branch",
      "sub_it_soft_dev"
    );

    // 6. Roles
    await createFilter(
      "role_navy_pilot",
      "SSC Pilot (Navy)",
      "role",
      "branch_navy_exec"
    );
    await createFilter(
      "role_navy_observer",
      "SSC Observer (Navy)",
      "role",
      "branch_navy_exec"
    );
    await createFilter(
      "role_navy_logistics",
      "SSC Logistics (Navy)",
      "role",
      "branch_navy_exec"
    );
    await createFilter(
      "role_react_dev",
      "React Developer",
      "role",
      "branch_soft_dev_front"
    );
    await createFilter(
      "role_vue_dev",
      "Vue.js Developer",
      "role",
      "branch_soft_dev_front"
    );
    await createFilter(
      "role_angular_dev",
      "Angular Developer",
      "role",
      "branch_soft_dev_front"
    );
    await createFilter(
      "role_ui_ux_designer",
      "UI/UX Designer",
      "role",
      "branch_soft_dev_front"
    );
    await createFilter(
      "role_nodejs_dev",
      "Node.js Developer",
      "role",
      "branch_soft_dev_back"
    );
    await createFilter(
      "role_python_dev",
      "Python Developer",
      "role",
      "branch_soft_dev_back"
    );
    await createFilter(
      "role_java_dev",
      "Java Developer",
      "role",
      "branch_soft_dev_back"
    );

    console.log("Filter Options Seeding Complete");
    return createdFilterIds;
  },
});

export const seedPosts = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting Sample Posts Seeding");

    // Get filter IDs first
    const filters = await ctx.db
      .query("FilterOption")
      .collect();
    const filterIdMap: {
      [key: string]: Id<"FilterOption">;
    } = {};

    // Create a map based on filter names for easier lookup
    for (const filter of filters) {
      const key = filter.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      filterIdMap[key] = filter._id;
    }

    // If no filters exist, create them first
    if (filters.length === 0) {
      console.log(
        "No filters found, please run seedFilters first"
      );
      return "Error: No filters found";
    }

    // Clear existing posts
    const existingPosts = await ctx.db
      .query("posts")
      .collect();
    for (const post of existingPosts) {
      await ctx.db.delete(post._id);
    }
    console.log(
      `Cleared ${existingPosts.length} existing posts`
    );

    // Ensure an admin user exists
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
        `Created admin user: ${adminUser.username}`
      );
    }

    const createdByUserId: Id<"users"> = adminUser._id;

    // Helper function to find filter by name
    const findFilterByName = (
      name: string
    ): Id<"FilterOption"> | undefined => {
      const filter = filters.find((f) => f.name === name);
      return filter?._id;
    };

    // Create sample posts with available filters
    const graduationId = findFilterByName("Graduation");
    const govtJobsId = findFilterByName("Government Jobs");
    const privateJobsId = findFilterByName("Private Jobs");
    const defenceId = findFilterByName("Defence Services");
    const itSoftwareId = findFilterByName("IT & Software");

    if (graduationId && govtJobsId && defenceId) {
      await ctx.db.insert("posts", {
        title:
          "SSC Pilot Vacancy – Indian Navy (Executive Branch)",
        description:
          "Opportunity to join the flying branch of Indian Navy. Requires Engineering Graduation with Physics & Math. Apply before 30th Sept.",
        filterOptionIds: [
          graduationId,
          govtJobsId,
          defenceId,
        ],
        postType: "job",
        sourceUrl: "https://indiannavy.nic.in/careers",
        imageUrl:
          "https://via.placeholder.com/400x200/00008B/FFFFFF?text=Indian+Navy",
        location: ["All India"],
        experience: "Fresher",
        salary: "As per Govt. Norms",
        likes: 0,
        comments: 0,
        createdBy: createdByUserId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      });
    }

    if (graduationId && privateJobsId && itSoftwareId) {
      await ctx.db.insert("posts", {
        title:
          "Junior React Developer at Tech Innovators Pvt. Ltd.",
        description:
          "Exciting role for fresh graduates passionate about building interactive user interfaces with React.js and Next.js.",
        filterOptionIds: [
          graduationId,
          privateJobsId,
          itSoftwareId,
        ],
        postType: "job",
        sourceUrl: "https://techinnovators.com/careers",
        imageUrl:
          "https://via.placeholder.com/400x200/008080/FFFFFF?text=React+Job",
        location: ["Bengaluru", "Remote"],
        experience: "Fresher",
        salary: "4-6 LPA",
        likes: 0,
        comments: 0,
        createdBy: createdByUserId,
        createdAt: Date.now() - 3600 * 1000,
        updatedAt: Date.now() - 3600 * 1000,
        isActive: true,
      });

      await ctx.db.insert("posts", {
        title: "Python Backend Developer - Fintech Startup",
        description:
          "Looking for a backend enthusiast with strong Python skills to build scalable financial applications.",
        filterOptionIds: [
          graduationId,
          privateJobsId,
          itSoftwareId,
        ],
        postType: "job",
        sourceUrl: "https://fintechstartup.com/careers",
        imageUrl:
          "https://via.placeholder.com/400x200/4B0082/FFFFFF?text=Python+Job",
        location: ["Mumbai"],
        experience: "1-2 years",
        salary: "7-10 LPA",
        likes: 0,
        comments: 0,
        createdBy: createdByUserId,
        createdAt: Date.now() - 2 * 24 * 3600 * 1000,
        updatedAt: Date.now() - 2 * 24 * 3600 * 1000,
        isActive: true,
      });
    }

    console.log("Sample Posts Seeding Complete");
    return "Success";
  },
});
