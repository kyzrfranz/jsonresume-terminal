import { html, css, LitElement } from 'lit';


export class JsonresumeTerminal extends LitElement {
  static get properties() {
    return {
      resumeData: { type: Object },
      _input: { type: String, state: true },
      _history: { type: Array, state: true },
      username: { type: String },
      githubUser: { type: String, attribute: 'github-user' },
      greeting: {type: String, attribute: 'greeting'}
    };
  }

  constructor() {
    super();
    this.resumeData = {};
    this._input = '';
    this.greeting = "Welcome to Jsonresume Terminal! Type 'help' to start."
    this._history = [];
    this._commandHistory = [];
    this._historyIndex = -1;
    this.username = this._generateUserName();
    this.commands = [
      { name: 'who', execute: () => this._showBasics() },
      { name: 'work list', execute: () => this._listWork() },
      { name: 'work show', execute: (args) => this._showWork(args) },
      { name: 'skills list', execute: () => this._listSkills() },
      { name: 'references list', execute: () => this._listReferences() },
      { name: 'help', execute: () => this._help() }
    ];
  }

  static get styles() {
    return css`
      :host {
        position: relative;
        display: inline-block;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: #1d1f21;
        color: #c5c8c6;
        font-family: 'Fira Code', 'Source Code Pro', monospace;
        font-size: 14px;
        line-height: 1.5;
        padding: 10px 10px 0;
      }

      .line {
        white-space: pre-wrap;
        display: flex;
        align-items: center;
      }

      .prompt {
        color: #81a2be;
        margin-right: 1em;
      }

      .input-container {
        flex-grow: 1;
        position: relative;
      }

      .input {
        outline: none;
        border: none;
        background: transparent;
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        caret-color: white;
        padding-left: 0;
      }

      .output {
        color: #c5c8c6;
        white-space: pre-wrap;
      }

      .cursor {
        position: absolute;
        background-color: white;
        width: 3px;
        height: 1.2em;
        pointer-events: none;
      }

      #scroll-anchor {
        margin-top: 1em;
      }

      @keyframes blink {
        50% {
          visibility: hidden;
        }
      }
    `;
  }

  _generateUserName() {
    const adjectives = ['cool', 'bright', 'cheerful', 'clever'];
    const nouns = ['cat', 'dog', 'fox', 'owl'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adjective}-${noun}-${number}`;
  }

  _help() {
    return `
Available Commands:
  who                 Show information from the "basics" section.
  work list           Show work history.
  work show           Display details of a specific work entry. Usage: work show <work.name>
  skills list         List all skills.
  references list     List all references.
  help                Show this help message.

Usage:
  <command> [options]

Use "help" for more information on a specific command.
    `;
  }

  _showBasics() {
    const basics = this.resumeData.basics;
    if (!basics) {
      return 'No basics info found.';
    }

    return `
Basic Information:
  Name:        ${basics.name}
  Label:       ${basics.label || 'N/A'}
  Email:       ${basics.email || 'N/A'}
  Phone:       ${basics.phone || 'N/A'}
  Website:     ${basics.url || 'N/A'}
  Summary:     ${basics.summary || 'N/A'}
  Location:
    City:      ${basics.location?.city || 'N/A'}
    Region:    ${basics.location?.region || 'N/A'}
    Country:   ${basics.location?.country || 'N/A'}
  Profiles:
${basics.profiles ? basics.profiles.map(profile => `    - ${profile.network}: ${profile.url}`).join('\n') : '    None'}
    `;
  }


  _listWork() {
    if (!this.resumeData.work || this.resumeData.work.length === 0) {
      return 'No work entries found.';
    }

    return `
Available Work Entries:
${this.resumeData.work.map((entry, index) => `  ${index + 1}. ${entry.name} (${entry.company})`).join('\n')}

Use "work show <id>" to display details of a specific entry.
    `;
  }

  _showWork(id) {
    const index = parseInt(id, 10) - 1;
    const entry = this.resumeData.work && this.resumeData.work[index];
    if (!entry) {
      return `Work entry with ID "${id}" not found.`;
    }

    const endDate = entry.endDate ? entry.endDate : 'Present';

    return `
Work Entry Details:
  ID:            ${id}
  Name:          ${entry.name}
  Position:      ${entry.position}
  Company:       ${entry.company}
  Start Date:    ${entry.startDate}
  End Date:      ${endDate}
  Summary:       ${entry.summary || 'N/A'}
  Highlights:
${entry.highlights ? entry.highlights.map(h => `    - ${h}`).join('\n') : '    None'}
    `;
  }


  _listSkills() {
    if (!this.resumeData.skills || this.resumeData.skills.length === 0) {
      return 'No skills found.';
    }

    return `
Skills:
${this.resumeData.skills.map(skill => `
  Name:        ${skill.name}
  Level:       ${skill.level}
  Keywords:
${skill.keywords && skill.keywords.length > 0 ? skill.keywords.map(kw => `    - ${kw}`).join('\n') : '    None'}
`).join('\n')}
    `;
  }


  _listReferences() {
    return this.resumeData.references
      ? this.resumeData.references.map(ref => ref.name).join('\n')
      : 'No references found.';
  }

  async _onEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = this._input.trim();
      if (input) {
        this._commandHistory.push(input);
        this._historyIndex = this._commandHistory.length; // Reset history index
        const [command, ...args] = input.split(' ');
        const fullCommand = [command, args[0]].filter(Boolean).join(' ');
        const matchedCommand = this.commands.find(({ name }) => name === fullCommand);

        const result = matchedCommand
          ? await matchedCommand.execute(args.slice(1).join(' '))
          : `${command} not found - try "help"`;

        this._history = [...this._history, { input, output: result }];
        this._input = '';
        const inputElement = this.shadowRoot.querySelector('.input');
        if (inputElement) inputElement.innerText = '';
        await this.updateComplete;
        this._focusInput();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this._historyIndex > 0) {
        this._historyIndex--;
        this._input = this._commandHistory[this._historyIndex];
        this._updateInputField();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this._historyIndex < this._commandHistory.length - 1) {
        this._historyIndex++;
        this._input = this._commandHistory[this._historyIndex];
      } else {
        this._historyIndex = this._commandHistory.length;
        this._input = '';
      }
      this._updateInputField();
    }
  }

  _updateInputField() {
    const inputElement = this.shadowRoot.querySelector('.input');
    if (inputElement) {
      inputElement.innerText = this._input;
    }
  }

  _handleTerminalClick(e) {
    // Check if the click target is NOT on selectable elements
    const isSelectable = e.composedPath().some(element =>
      element.classList?.contains('output') ||
      element.classList?.contains('input-text')
    );

    if (!isSelectable) {
      this._focusInput();
    }
  }

  _focusInput() {
    const inputElement = this.shadowRoot.querySelector('.input');
    if (inputElement) {
      inputElement.focus();
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this.githubUser) {
      await this._fetchResumeFromGithub();
    }
    this._history = [{ input: null, output: this.greeting }];
    this.addEventListener('click', this._handleTerminalClick.bind(this));
  }

  async _fetchResumeFromGithub() {
    try {
      const response = await fetch(`https://api.github.com/users/${this.githubUser}/gists`);
      const gists = await response.json();
      const resumeGist = gists.find(gist => gist.files && gist.files['resume.json']);

      if (resumeGist) {
        const rawUrl = resumeGist.files['resume.json'].raw_url;
        const resumeResponse = await fetch(rawUrl);
        this.resumeData = await resumeResponse.json();
        this._history.push({ input: null, output: "Resume data loaded from GitHub." });
      } else {
        this._history.push({ input: null, output: "No 'resume.json' gist found for this user." });
      }
    } catch (error) {
      this._history.push({ input: null, output: `Error fetching resume data: ${error.message}` });
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('_history')) {
      const scrollAnchor = this.shadowRoot.querySelector('#scroll-anchor');
      if (scrollAnchor) {
        scrollAnchor.scrollIntoView({ block: 'end' });
      }
    }
  }

  render() {
    return html`
        <div class="terminal">
            ${this._history.map(({ input, output }) => html`
                <div class="line">
                    ${input !== null ? html`<span class="prompt">${this.username}@terminal:~$</span><span class="input-text">${input}</span>` : ''}
                </div>
                <div class="output">${output}</div>
            `)}
            <div class="line">
                <span class="prompt">${this.username}@terminal:~$</span>
                <span class="input" @keydown="${this._onEnter}" @input="${e => this._input = e.target.innerText}" contenteditable="true"></span>
            </div>
            <div id="scroll-anchor"></div> <!-- Invisible anchor element at the bottom -->
        </div>
    `;
  }

}
