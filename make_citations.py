import arxiv
import re

def format_author(author):
    name_parts = re.split(r'\s+', author.name)
    first_name = name_parts[0]
    last_name = name_parts[-1]
    return first_name, last_name

def return_citation(result, style='APA'):
    if style == 'APA':
        authors = ', '.join(['{} {}'.format(*format_author(author)) for author in result.authors])
        year = result.published.year
        title = result.title
        journal = result.journal_ref if result.journal_ref else 'arXiv preprint'
        doi = result.doi if result.doi else ''
        citation = f"{authors} ({year}). {title}. {journal}. {doi}"
    elif style == 'MLA':
        authors = ', '.join(['{} {}'.format(*format_author(author)) for author in result.authors])
        title = f'"{result.title}."'
        journal = result.journal_ref if result.journal_ref else 'arXiv preprint'
        year = result.published.year
        doi = result.doi if result.doi else ''
        citation = f"{authors}. {title} {journal}, {year}. {doi}"
    else:
        raise ValueError("Unsupported citation style")

    return citation

def get_arxiv_id(link):
    if '/abs/' in link:
        return link.split('/abs/')[1]
    else:
        return link.split('/pdf/')[1].split('.pdf')[0]

# function that takes in arxiv link, returns citation
def return_citation(arxiv_link):
    arxiv_id = get_arxiv_id(arxiv_link)
    search = arxiv.Search(id_list=[arxiv_id])
    result = next(search.results())
    citation_apa = return_citation(result, style='APA')
    print(citation_apa)
    return citation_apa