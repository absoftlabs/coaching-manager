import {
    BarChart3,
    BookOpen,
    CalendarCheck,
    ClipboardList,
    FileSearch,
    GraduationCap,
    Layers,
    LayoutDashboard,
    ListChecks,
    MessageSquare,
    MessageSquarePlus,
    MessagesSquare,
    PauseCircle,
    PlusSquare,
    Receipt,
    Settings,
    SlidersHorizontal,
    UserPlus,
    UserRoundX,
    Users,
    Wallet,
    Presentation,
    Send,
    type LucideIcon,
} from "lucide-react";

export type NavLeaf = { label: string; href: string; icon: LucideIcon };
export type NavGroup = { label: string; icon: LucideIcon; items: NavLeaf[] };
export type NavEntry = NavLeaf | NavGroup;

export const NAV: NavEntry[] = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    {
        label: "Students",
        icon: GraduationCap,
        items: [
            { label: "Add Student", href: "/add-student", icon: UserPlus },
            { label: "Student List", href: "/student-list", icon: Users },
            { label: "Suspended Students", href: "/suspended-students", icon: UserRoundX },
            { label: "Student Report", href: "/students-report", icon: BarChart3 },
        ],
    },
    {
        label: "Teachers",
        icon: Presentation,
        items: [
            { label: "Add Teacher", href: "/add-teacher", icon: UserPlus },
            { label: "Teacher List", href: "/teacher-list", icon: Users },
            { label: "Suspended Teachers", href: "/suspended-teacher", icon: PauseCircle },
            { label: "Teacher Report", href: "/teachers-report", icon: BarChart3 },
        ],
    },
    {
        label: "Classes",
        icon: BookOpen,
        items: [
            { label: "Add Class", href: "/add-class", icon: PlusSquare },
            { label: "Class List", href: "/class-list", icon: ClipboardList },
            { label: "Class Report", href: "/classes-report", icon: BarChart3 },
        ],
    },
    { label: "Batches", href: "/batch-list", icon: Layers },
    {
        label: "Results",
        icon: ListChecks,
        items: [
            { label: "Add Result", href: "/add-result", icon: PlusSquare },
            { label: "Result List", href: "/result-list", icon: ClipboardList },
            { label: "Result Parameters", href: "/result-parameters", icon: SlidersHorizontal },
            { label: "Find Result", href: "/find-result", icon: FileSearch },
            { label: "Result Report", href: "/results-report", icon: BarChart3 },
        ],
    },
    {
        label: "Fees",
        icon: Wallet,
        items: [
            { label: "Collect Fees", href: "/add-fees", icon: Wallet },
            { label: "Fees List", href: "/fees-list", icon: Receipt },
        ],
    },
    { label: "Attendance", href: "/attendance", icon: CalendarCheck },
    {
        label: "SMS",
        icon: MessageSquare,
        items: [
            { label: "SMS Templates", href: "/sms/templates", icon: MessageSquarePlus },
            { label: "SMS Students", href: "/sms/students", icon: MessagesSquare },
            { label: "SMS Teachers", href: "/sms/teachers", icon: Send },
        ],
    },
    { label: "Settings", href: "/settings", icon: Settings },
];

const TEACHER_NAV: NavEntry[] = [{ label: "Attendance", href: "/attendance", icon: CalendarCheck }];

/** Bottom tab bar on phones (admin). The last slot opens the full menu. */
export const MOBILE_TABS: NavLeaf[] = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Students", href: "/student-list", icon: GraduationCap },
    { label: "Attendance", href: "/attendance", icon: CalendarCheck },
    { label: "Fees", href: "/fees-list", icon: Wallet },
];

export function isNavGroup(entry: NavEntry): entry is NavGroup {
    return "items" in entry;
}

export function getNavForRole(role: "admin" | "teacher"): NavEntry[] {
    return role === "teacher" ? TEACHER_NAV : NAV;
}

const EXTRA_TITLES: Array<[RegExp, string]> = [
    [/^\/change-password$/, "Change Password"],
    [/^\/edit-student\//, "Edit Student"],
    [/^\/edit-teacher\//, "Edit Teacher"],
    [/^\/edit-class\//, "Edit Class"],
    [/^\/edit-result\//, "Edit Result"],
    [/^\/edit-fee\//, "Edit Fee"],
    [/^\/sms$/, "SMS"],
];

export function getPageTitle(pathname: string): string {
    for (const entry of NAV) {
        if (isNavGroup(entry)) {
            const match = entry.items.find((i) => i.href === pathname);
            if (match) return match.label;
        } else if (entry.href === pathname) {
            return entry.label;
        }
    }
    for (const [re, title] of EXTRA_TITLES) if (re.test(pathname)) return title;
    return "Coaching Manager";
}
