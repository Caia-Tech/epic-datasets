// Simple Constitution Website JavaScript
class ConstitutionApp {
    constructor() {
        this.articles = this.getArticlesData();
        this.amendments = this.getAmendmentsData();
        this.init();
    }

    init() {
        this.populateArticles();
        this.populateAmendments();
        this.setupSearch();
    }

    // Articles Data
    getArticlesData() {
        return [
            {
                number: 1,
                title: "The Legislative Branch",
                sections: [
                    {
                        section: "Section 1",
                        text: "All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives."
                    },
                    {
                        section: "Section 2",
                        text: "The House of Representatives shall be composed of Members chosen every second Year by the People of the several States, and the Electors in each State shall have the Qualifications requisite for Electors of the most numerous Branch of the State Legislature."
                    },
                    {
                        section: "Section 3", 
                        text: "The Senate of the United States shall be composed of two Senators from each State, chosen by the Legislature thereof, for six Years; and each Senator shall have one Vote."
                    },
                    {
                        section: "Section 8",
                        text: "The Congress shall have Power To lay and collect Taxes, Duties, Imposts and Excises, to pay the Debts and provide for the common Defence and general Welfare of the United States..."
                    }
                ]
            },
            {
                number: 2,
                title: "The Executive Branch",
                sections: [
                    {
                        section: "Section 1",
                        text: "The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years, and, together with the Vice President, chosen for the same Term, be elected, as follows..."
                    },
                    {
                        section: "Section 2",
                        text: "The President shall be Commander in Chief of the Army and Navy of the United States, and of the Militia of the several States, when called into the actual Service of the United States..."
                    }
                ]
            },
            {
                number: 3,
                title: "The Judicial Branch",
                sections: [
                    {
                        section: "Section 1",
                        text: "The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish."
                    },
                    {
                        section: "Section 2",
                        text: "The judicial Power shall extend to all Cases, in Law and Equity, arising under this Constitution, the Laws of the United States, and Treaties made, or which shall be made, under their Authority..."
                    }
                ]
            },
            {
                number: 4,
                title: "Relations Between States",
                sections: [
                    {
                        section: "Section 1",
                        text: "Full Faith and Credit shall be given in each State to the public Acts, Records, and judicial Proceedings of every other State."
                    }
                ]
            },
            {
                number: 5,
                title: "Amendment Process",
                sections: [
                    {
                        section: "",
                        text: "The Congress, whenever two thirds of both Houses shall deem it necessary, shall propose Amendments to this Constitution, or, on the Application of the Legislatures of two thirds of the several States, shall call a Convention for proposing Amendments..."
                    }
                ]
            },
            {
                number: 6,
                title: "Federal Power",
                sections: [
                    {
                        section: "",
                        text: "This Constitution, and the Laws of the United States which shall be made in Pursuance thereof; and all Treaties made, or which shall be made, under the Authority of the United States, shall be the supreme Law of the Land..."
                    }
                ]
            },
            {
                number: 7,
                title: "Ratification",
                sections: [
                    {
                        section: "",
                        text: "The Ratification of the Conventions of nine States, shall be sufficient for the Establishment of this Constitution between the States so ratifying the Same."
                    }
                ]
            }
        ];
    }

    // Amendments Data
    getAmendmentsData() {
        return [
            {
                number: 1,
                text: "Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances."
            },
            {
                number: 2,
                text: "A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed."
            },
            {
                number: 3,
                text: "No Soldier shall, in time of peace be quartered in any house, without the consent of the Owner, nor in time of war, but in a manner to be prescribed by law."
            },
            {
                number: 4,
                text: "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized."
            },
            {
                number: 5,
                text: "No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury, except in cases arising in the land or naval forces, or in the Militia, when in actual service in time of War or public danger; nor shall any person be subject for the same offence to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation."
            },
            {
                number: 6,
                text: "In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed, which district shall have been previously ascertained by law, and to be informed of the nature and cause of the accusation; to be confronted with the witnesses against him; to have compulsory process for obtaining witnesses in his favor, and to have the Assistance of Counsel for his defence."
            },
            {
                number: 7,
                text: "In Suits at common law, where the value in controversy shall exceed twenty dollars, the right of trial by jury shall be preserved, and no fact tried by a jury, shall be otherwise re-examined in any Court of the United States, than according to the rules of the common law."
            },
            {
                number: 8,
                text: "Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted."
            },
            {
                number: 9,
                text: "The enumeration in the Constitution, of certain rights, shall not be construed to deny or disparage others retained by the people."
            },
            {
                number: 10,
                text: "The powers not delegated to the United States by the Constitution, nor prohibited by it to the States, are reserved to the States respectively, or to the people."
            },
            {
                number: 11,
                text: "The Judicial power of the United States shall not be construed to extend to any suit in law or equity, commenced or prosecuted against one of the United States by Citizens of another State, or by Citizens or Subjects of any Foreign State."
            },
            {
                number: 12,
                text: "The Electors shall meet in their respective states, and vote by ballot for President and Vice-President, one of whom, at least, shall not be an inhabitant of the same state with themselves; they shall name in their ballots the person voted for as President, and in distinct ballots the person voted for as Vice-President..."
            },
            {
                number: 13,
                text: "Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States, or any place subject to their jurisdiction."
            },
            {
                number: 14,
                text: "All persons born or naturalized in the United States, and subject to the jurisdiction thereof, are citizens of the United States and of the State wherein they reside. No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws."
            },
            {
                number: 15,
                text: "The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of race, color, or previous condition of servitude."
            },
            {
                number: 16,
                text: "The Congress shall have power to lay and collect taxes on incomes, from whatever source derived, without apportionment among the several States, and without regard to any census or enumeration."
            },
            {
                number: 17,
                text: "The Senate of the United States shall be composed of two Senators from each State, elected by the people thereof, for six years; and each Senator shall have one vote."
            },
            {
                number: 18,
                text: "After one year from the ratification of this article the manufacture, sale, or transportation of intoxicating liquors within, the importation thereof into, or the exportation thereof from the United States and all territory subject to the jurisdiction thereof for beverage purposes is hereby prohibited. [REPEALED]"
            },
            {
                number: 19,
                text: "The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of sex."
            },
            {
                number: 20,
                text: "The terms of the President and Vice President shall end at noon on the 20th day of January, and the terms of Senators and Representatives at noon on the 3d day of January, of the years in which such terms would have ended if this article had not been ratified; and the terms of their successors shall then begin."
            },
            {
                number: 21,
                text: "The eighteenth article of amendment to the Constitution of the United States is hereby repealed."
            },
            {
                number: 22,
                text: "No person shall be elected to the office of the President more than twice, and no person who has held the office of President, or acted as President, for more than two years of a term to which some other person was elected President shall be elected to the office of the President more than once."
            },
            {
                number: 23,
                text: "The District constituting the seat of Government of the United States shall appoint in such manner as the Congress may direct: A number of electors of President and Vice President equal to the whole number of Senators and Representatives in Congress to which the District would be entitled if it were a State, but in no event more than the least populous State..."
            },
            {
                number: 24,
                text: "The right of citizens of the United States to vote in any primary or other election for President or Vice President, for electors for President or Vice President, or for Senator or Representative in Congress, shall not be denied or abridged by the United States or any State by reason of failure to pay any poll tax or other tax."
            },
            {
                number: 25,
                text: "In case of the removal of the President from office or of his death or resignation, the Vice President shall become President."
            },
            {
                number: 26,
                text: "The right of citizens of the United States, who are eighteen years of age or older, to vote shall not be denied or abridged by the United States or by any State on account of age."
            },
            {
                number: 27,
                text: "No law, varying the compensation of the Senators and Representatives, shall take effect, until an election of Representatives shall have intervened."
            }
        ];
    }

    // Populate Articles
    populateArticles() {
        const container = document.getElementById('articles-content');
        this.articles.forEach(article => {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'article';
            
            let sectionsHTML = '';
            article.sections.forEach(section => {
                sectionsHTML += `
                    <div class="section-title">${section.section}</div>
                    <div class="article-text">${section.text}</div>
                `;
            });

            articleDiv.innerHTML = `
                <h3><span class="article-number">Article ${article.number}</span> - ${article.title}</h3>
                ${sectionsHTML}
            `;
            
            container.appendChild(articleDiv);
        });
    }

    // Populate Amendments
    populateAmendments() {
        const container = document.getElementById('amendments-content');
        this.amendments.forEach(amendment => {
            const amendmentDiv = document.createElement('div');
            amendmentDiv.className = 'amendment';
            
            amendmentDiv.innerHTML = `
                <h3><span class="amendment-number">Amendment ${amendment.number}</span></h3>
                <div class="amendment-text">${amendment.text}</div>
            `;
            
            container.appendChild(amendmentDiv);
        });
    }

    // Search Setup
    setupSearch() {
        const searchInput = document.getElementById('constitution-search');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchConstitution();
            }
        });

        const aiSearchInput = document.getElementById('ai-search');
        aiSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.aiSearch();
            }
        });
    }

    // Search Function
    searchConstitution() {
        const query = document.getElementById('constitution-search').value.toLowerCase().trim();
        if (!query) return;

        const results = [];
        
        // Search preamble
        const preambleText = "We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.";
        if (preambleText.toLowerCase().includes(query)) {
            results.push({
                type: 'Preamble',
                text: preambleText,
                match: query
            });
        }

        // Search articles
        this.articles.forEach(article => {
            article.sections.forEach(section => {
                if (section.text.toLowerCase().includes(query) || article.title.toLowerCase().includes(query)) {
                    results.push({
                        type: `Article ${article.number}`,
                        title: article.title,
                        text: section.text,
                        section: section.section,
                        match: query
                    });
                }
            });
        });

        // Search amendments
        this.amendments.forEach(amendment => {
            if (amendment.text.toLowerCase().includes(query)) {
                results.push({
                    type: `Amendment ${amendment.number}`,
                    text: amendment.text,
                    match: query
                });
            }
        });

        this.displaySearchResults(results, query);
    }

    // Display Search Results
    displaySearchResults(results, query) {
        const resultsDiv = document.getElementById('search-results');
        resultsDiv.style.display = 'block';
        
        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <h3>No Results Found</h3>
                <p>No matches found for "${query}"</p>
            `;
            return;
        }

        let resultsHTML = `<h3>Search Results for "${query}" (${results.length} found)</h3>`;
        
        results.forEach(result => {
            const highlightedText = this.highlightSearchTerm(result.text, query);
            resultsHTML += `
                <div class="search-result">
                    <h4>${result.type}${result.title ? ' - ' + result.title : ''}</h4>
                    ${result.section ? `<strong>${result.section}</strong><br>` : ''}
                    <p>${highlightedText}</p>
                </div>
            `;
        });
        
        resultsDiv.innerHTML = resultsHTML;
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    // Highlight Search Terms
    highlightSearchTerm(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // AI Search Function
    aiSearch() {
        const query = document.getElementById('ai-search').value.trim();
        if (!query) return;

        // Check security and consent
        if (!window.securityManager) {
            alert('Security system not initialized. Please refresh the page.');
            return;
        }

        try {
            // Prepare API request with security checks
            const apiRequest = window.securityManager.prepareAPIRequest(query);
            
            const aiResultsDiv = document.getElementById('ai-results');
            aiResultsDiv.style.display = 'block';
            aiResultsDiv.innerHTML = `
                <h3>AI Analysis</h3>
                <div class="ai-answer">Analyzing your question: "${query}"...</div>
                <p style="font-size: 0.8em; color: #666;">Session: ${apiRequest.metadata.sessionId}</p>
            `;

            // Log the query
            console.log('API Request prepared:', apiRequest);

            // Simulate AI processing time
            setTimeout(() => {
                const response = this.generateAIResponse(query);
                this.displayAIResults(response, query);
                
                // Log successful query
                window.securityManager.logEvent('query_success', { 
                    query: query,
                    responseLength: JSON.stringify(response).length 
                });
            }, 1500);
            
        } catch (error) {
            // Handle security errors
            const aiResultsDiv = document.getElementById('ai-results');
            aiResultsDiv.style.display = 'block';
            
            if (error.message.includes('Rate limit')) {
                aiResultsDiv.innerHTML = `
                    <div class="rate-limit-warning">
                        <h3>⚠️ Rate Limit Exceeded</h3>
                        <p>${error.message}</p>
                        <p>Our rate limits help ensure fair usage and prevent abuse.</p>
                    </div>
                `;
            } else if (error.message.includes('policy violation')) {
                aiResultsDiv.innerHTML = `
                    <div class="suspicious-warning">
                        <h3>🚫 Query Blocked</h3>
                        <p>${error.message}</p>
                        <p>Please ensure your queries comply with our Terms of Service.</p>
                        <p style="font-size: 0.9em; margin-top: 10px;">
                            <strong>Note:</strong> This incident has been logged. 
                            Repeated violations may result in permanent blocking.
                        </p>
                    </div>
                `;
            } else if (error.message.includes('consent')) {
                aiResultsDiv.innerHTML = `
                    <div class="suspicious-warning">
                        <h3>📋 Consent Required</h3>
                        <p>Please accept the Terms of Service to use the AI feature.</p>
                        <p>Refresh the page to see the consent form.</p>
                    </div>
                `;
            } else {
                aiResultsDiv.innerHTML = `
                    <div class="rate-limit-warning">
                        <h3>❌ Error</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
            
            // Log the error
            window.securityManager.logEvent('query_error', { 
                query: query,
                error: error.message 
            });
        }
    }

    // Generate AI-like response
    generateAIResponse(query) {
        const queryLower = query.toLowerCase();
        
        // Pattern matching for different types of questions
        if (queryLower.includes('arrest') || queryLower.includes('police') || queryLower.includes('search')) {
            return {
                answer: "When arrested or searched by police, you have several key constitutional protections. The 4th Amendment protects against unreasonable searches and seizures, requiring warrants based on probable cause. The 5th Amendment protects against self-incrimination (right to remain silent), and the 6th Amendment guarantees your right to an attorney.",
                citations: [
                    { ref: "4th Amendment", text: "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures..." },
                    { ref: "5th Amendment", text: "...nor shall be compelled in any criminal case to be a witness against himself..." },
                    { ref: "6th Amendment", text: "...and to have the Assistance of Counsel for his defence." }
                ]
            };
        }
        
        if (queryLower.includes('speech') || queryLower.includes('religion') || queryLower.includes('press')) {
            return {
                answer: "The 1st Amendment provides comprehensive protection for freedom of speech, religion, press, assembly, and petition. The government cannot establish religion, prohibit religious exercise, restrict speech or press, prevent peaceful assembly, or deny the right to petition for redress of grievances.",
                citations: [
                    { ref: "1st Amendment", text: "Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances." }
                ]
            };
        }
        
        if (queryLower.includes('due process') || queryLower.includes('fair') || queryLower.includes('trial')) {
            return {
                answer: "Due process is protected by both the 5th and 14th Amendments. You cannot be deprived of life, liberty, or property without due process of law. The 6th Amendment guarantees specific trial rights including speedy and public trial, impartial jury, right to confront witnesses, and right to counsel.",
                citations: [
                    { ref: "5th Amendment", text: "...nor be deprived of life, liberty, or property, without due process of law..." },
                    { ref: "14th Amendment", text: "...nor shall any State deprive any person of life, liberty, or property, without due process of law..." },
                    { ref: "6th Amendment", text: "In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury..." }
                ]
            };
        }
        
        if (queryLower.includes('equal') || queryLower.includes('discrimination')) {
            return {
                answer: "The 14th Amendment's Equal Protection Clause prohibits states from denying any person equal protection of the laws. This prevents discrimination and ensures fair treatment under law. The 15th Amendment specifically prohibits voting discrimination based on race, and the 19th Amendment prohibits voting discrimination based on sex.",
                citations: [
                    { ref: "14th Amendment", text: "...nor deny to any person within its jurisdiction the equal protection of the laws." },
                    { ref: "15th Amendment", text: "The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of race, color, or previous condition of servitude." },
                    { ref: "19th Amendment", text: "The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of sex." }
                ]
            };
        }
        
        if (queryLower.includes('property') || queryLower.includes('take') || queryLower.includes('eminent')) {
            return {
                answer: "The 5th Amendment contains the Takings Clause, which prevents the government from taking private property for public use without just compensation. This is known as eminent domain protection - the government can take property for legitimate public purposes, but must pay fair compensation.",
                citations: [
                    { ref: "5th Amendment", text: "...nor shall private property be taken for public use, without just compensation." }
                ]
            };
        }

        if (queryLower.includes('vote') || queryLower.includes('voting') || queryLower.includes('election')) {
            return {
                answer: "Your voting rights are protected by multiple amendments. The 15th Amendment prohibits racial voting discrimination, the 19th Amendment prohibits sex-based voting discrimination, the 24th Amendment prohibits poll taxes, and the 26th Amendment sets the voting age at 18.",
                citations: [
                    { ref: "15th Amendment", text: "The right of citizens of the United States to vote shall not be denied or abridged... on account of race, color, or previous condition of servitude." },
                    { ref: "19th Amendment", text: "The right of citizens of the United States to vote shall not be denied or abridged... on account of sex." },
                    { ref: "24th Amendment", text: "The right of citizens... to vote... shall not be denied or abridged... by reason of failure to pay any poll tax..." },
                    { ref: "26th Amendment", text: "The right of citizens of the United States, who are eighteen years of age or older, to vote shall not be denied..." }
                ]
            };
        }

        // Default response for unrecognized queries
        return {
            answer: "I found several constitutional provisions that may relate to your question. The Constitution establishes the framework for government powers and individual rights. For specific legal advice, consult with a qualified attorney who can analyze your particular situation.",
            citations: [
                { ref: "General Note", text: "The Constitution serves as the supreme law of the land, establishing both the structure of government and fundamental individual rights." }
            ]
        };
    }

    // Display AI Results
    displayAIResults(response, query) {
        const aiResultsDiv = document.getElementById('ai-results');
        
        let citationsHTML = '';
        response.citations.forEach(citation => {
            citationsHTML += `
                <div class="ai-citation">
                    <h5>${citation.ref}</h5>
                    <p>${citation.text}</p>
                </div>
            `;
        });

        aiResultsDiv.innerHTML = `
            <h3>Constitutional Analysis for "${query}"</h3>
            <div class="ai-answer">${response.answer}</div>
            <div class="ai-citations">
                <h4>Relevant Constitutional Provisions:</h4>
                ${citationsHTML}
            </div>
            <p style="font-size: 0.9em; color: #666; margin-top: 15px; font-style: italic;">
                This analysis is for educational purposes only and does not constitute legal advice.
            </p>
        `;
        
        aiResultsDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

// Global search functions
function searchConstitution() {
    window.constitutionApp.searchConstitution();
}

function aiSearch() {
    window.constitutionApp.aiSearch();
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    window.constitutionApp = new ConstitutionApp();
});