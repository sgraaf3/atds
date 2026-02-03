/**
 * MODULE: StansPage
 * A tribute module to Stans van der Poel: Inventions, Academy, and Legacy.
 */
export class StansPage {
    constructor() {
        this.content = {
            bio: "Stans van der Poel (1955) is a pioneer in lung function analysis and exercise physiology. She bridged the gap between medical science and sports performance with her Energy Control Method.",
            collaborators: [
                { name: "Koen de Jong", role: "Sportrusten founder and co-author of 'De Hardlooprevolutie'. Credits Stans as his 'leermeester' who taught him recovery is as important as training." },
                { name: "Patrick van Luijk", role: "Olympic sprinter and co-founder of BioCheck (Rotterdam), an innovative center for burnout recovery using Stans's methods." },
                { name: "Bram Bakker", role: "Psychiatrist using EC-methodology for stress and burnout recovery." },
                { name: "Wim Hof", role: "The 'Iceman'; Stans provided scientific validation for his breathing methods, explaining the physiological recovery response." }
            ],
            books: ["Chronische vermoeidheid nooit meer!", "Ik, hardloper", "De Marathon Revolutie", "De Hardlooprevolutie"],
            inventions: {
                devices: ["Co2ntrol", "EC-coach", "EC teamsystem", "EC-Watch"],
                apps: ["BioCheck App", "EnergyControl Test App"],
                patent: "System for testing respiratory workload and heart rate variability (HRV)." // General description
            },
            sportsLegacy: {
                football: "Performance consultant for top clubs in Holland (Eredivisie) and England (Premier League), focusing on fat-burning and recovery.",
                skating: "Coaching and testing elite athletes in Pro Speed Skating and Short Track, improving aerobic engines."
            }
        };

        this.academyLinks = {
            "Coach Opleiding": "https://stansvanderpoel.nl/opleiding-coach-energy-control/",
            "Ademtherapie": "https://stansvanderpoel.nl/cursus-ademtherapie/",
            "Specialisaties": "https://stansvanderpoel.nl/workshops/"
        };

        this.youtubeLinks = [
            { title: "Stans on Stress & Breathing", url: "https://www.youtube.com/watch?v=gW6z7B4RzMo" },
            { title: "Official Energy Control Channel", url: "https://www.youtube.com/@stansvanderpoel8976" }
        ];

        this.blogLinks = {
            herBlogs: [
                { title: "Latest EC Insights", url: "https://stansvanderpoel.nl/blog/" },
                { title: "On Extra Oxygen Intake", url: "https://stansvanderpoel.nl/waarom-die-extra-zuurstof/" }
            ],
            mentions: [
                { title: "Sportrusten: Leermeester", url: "https://www.sportrusten.nl/leermeester-stans-van-der-poel/" },
                { title: "BioCheck: Method Grounding", url: "https://biocheck.nl/over-ons/" }
            ]
        };
    }

    render() {
        const container = document.getElementById('resultsArea');
        if (!container) return;

        container.innerHTML = `
            <div class="honour-page" style="padding: 20px; line-height: 1.6; max-width: 900px; margin: 0 auto;">
                <header style="border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 25px; text-align: center;">
                    <h1 style="color: #2c3e50; margin-bottom: 5px;">Honouring Stans van der Poel</h1>
                    <p style="color: #7f8c8d; font-style: italic;" data-i18n="stansSubtitle">${i18n.translate('stansSubtitle')}</p>
                </header>

                <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #3498db; margin-top: 0;">🎓 The Academy & Method</h3>
                        <p>${this.content.bio}</p>
                        <p><strong>Energy Control Academy:</strong> Established to train coaches in ademtherapie and exercise physiology.</p>
                        <h4 style="margin-top: 20px;" data-i18n="courses">${i18n.translate('courses')}</h4>
                        <ul style="list-style-type: disc; padding-left: 20px;">
                            ${Object.entries(this.academyLinks).map(([name, url]) =>
                                `<li><a href="${url}" target="_blank" style="color: #2c3e50; text-decoration: none;">${i18n.translate(name.toLowerCase().replace(/ /g, ''))}</a></li>`).join('')}
                        </ul>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #3498db; margin-top: 0;">🤝 Collaborations & Impact</h3>
                        <ul style="list-style-type: disc; padding-left: 20px;">
                            ${this.content.collaborators.map(c =>
                                `<li><strong>${c.name}:</strong> ${c.role}</li>`).join('')}
                        </ul>
                        <h4 style="margin-top: 20px;">Elite Sports Achievements:</h4>
                        <ul style="list-style-type: disc; padding-left: 20px;">
                            <li><strong>Premier League & Holland Football:</strong> ${this.content.sportsLegacy.football}</li>
                            <li><strong>Ice Skating:</strong> ${this.content.sportsLegacy.skating}</li>
                        </ul>
                    </div>
                </section>

                <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #3498db; margin-top: 0;">💡 Inventions & Patents</h3>
                        <p>Developer of multiple devices to test breathing and metabolic load.</p>
                        <ul style="list-style-type: disc; padding-left: 20px;">
                            <li><strong>Hardware:</strong> ${this.content.inventions.devices.join(", ")}.</li>
                            <li><strong>Apps:</strong> ${this.content.inventions.apps.join(", ")}.</li>
                            <li><strong>Patent:</strong> ${this.content.inventions.patent}</li>
                        </ul>
                        <h4 style="margin-top: 20px;">Books:</h4>
                        <ul style="list-style-type: disc; padding-left: 20px;">
                            ${this.content.books.map(book => `<li>${book}</li>`).join('')}
                        </ul>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #3498db; margin-top: 0;">📺 Media & Blogs</h3>
                        <h4 style="margin-top: 0;">YouTube & Video Features:</h4>
                        <ul style="list-style-type: disc; padding-left: 20px;">
                            ${this.youtubeLinks.map(link =>
                                `<li><a href="${link.url}" target="_blank" style="color: #2c3e50; text-decoration: none;">${link.title}</a></li>`).join('')}
                        </ul>
                        <h4 style="margin-top: 20px;">Blogs & Mentions:</h4>
                        <div style="display: flex; gap: 20px;">
                            <div>
                                <strong>Her Blogs</strong>
                                <ul style="list-style-type: disc; padding-left: 20px;">
                                    ${this.blogLinks.herBlogs.map(link =>
                                        `<li><a href="${link.url}" target="_blank" style="color: #2c3e50; text-decoration: none;">${link.title}</a></li>`).join('')}
                                </ul>
                            </div>
                            <div>
                                <strong>Mentions</strong>
                                <ul style="list-style-type: disc; padding-left: 20px;">
                                    ${this.blogLinks.mentions.map(link =>
                                        `<li><a href="${link.url}" target="_blank" style="color: #2c3e50; text-decoration: none;">${link.title}</a></li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="faqSection" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h3 style="color: #3498db; margin-top: 0;">❓ FAQ: Energy Control Method</h3>
                    <h4 style="margin-top: 15px;">"I am exhausted; why should I exercise?"</h4>
                    <p>Chronic fatigue is often caused by an "idling motor" that burns sugar in rest. Balans-level exercise helps your muscles store more glycogen, eventually doubling your energy reserves.</p>
                    <h4 style="margin-top: 15px;">"Why do my hands and feet feel cold?"</h4>
                    <p>Low CO2 levels from over-breathing cause blood vessels to constrict. Warming hands/feet during therapy is a primary sign of successful metabolic balance.</p>
                    <h4 style="margin-top: 15px;">"What if I don't lose weight immediately?"</h4>
                    <p>Muscles that are activated through training require more energy to maintain, even while you sleep. Focus on getting stronger first; the weight loss will follow once the system is "awake".</p>
                    <h4 style="margin-top: 15px;">"What is the best training balance?"</h4>
                    <p>The ideal state is 50% fat and 50% sugar burning, as this is where the body is most in balance—sometimes even more so than in absolute rest.</p>
                </section>

                <footer style="text-align: center; color: #7f8c8d; font-size: 0.8em; padding-top: 20px; border-top: 1px solid #eee;">
                    &copy; 2024 ATDS Health & Breath Analyzer. All rights reserved.
                </footer>
            </div>
        `;
    }
}