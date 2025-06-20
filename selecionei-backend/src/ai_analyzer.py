import re
import json
import datetime
from typing import Dict, List, Optional, Tuple
import PyPDF2
import docx
from io import BytesIO

class IntelligentResumeAnalyzer:
    """IA avançada para análise de currículos"""
    
    def __init__(self):
        self.skills_database = {
            'programming': [
                'python', 'javascript', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'swift',
                'kotlin', 'typescript', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash'
            ],
            'web_frontend': [
                'react', 'vue', 'angular', 'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
                'jquery', 'webpack', 'vite', 'next.js', 'nuxt.js', 'svelte'
            ],
            'web_backend': [
                'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net',
                'fastapi', 'nestjs', 'koa', 'gin', 'echo'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
                'cassandra', 'elasticsearch', 'dynamodb', 'firebase'
            ],
            'cloud_devops': [
                'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions',
                'terraform', 'ansible', 'vagrant', 'helm', 'prometheus', 'grafana'
            ],
            'data_science': [
                'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'matplotlib',
                'seaborn', 'plotly', 'jupyter', 'spark', 'hadoop', 'tableau', 'power bi'
            ],
            'mobile': [
                'react native', 'flutter', 'ionic', 'xamarin', 'android', 'ios', 'swift ui',
                'kotlin multiplatform'
            ],
            'tools': [
                'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'teams',
                'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator'
            ],
            'methodologies': [
                'agile', 'scrum', 'kanban', 'lean', 'devops', 'ci/cd', 'tdd', 'bdd', 'ddd',
                'microservices', 'rest', 'graphql', 'soap'
            ]
        }
        
        self.experience_keywords = {
            'junior': ['estagiário', 'trainee', 'junior', 'iniciante', 'aprendiz', 'assistente'],
            'pleno': ['pleno', 'analista', 'desenvolvedor', 'especialista', 'consultor'],
            'senior': ['senior', 'sênior', 'líder', 'coordenador', 'gerente', 'supervisor', 'tech lead', 'arquiteto']
        }
        
        self.education_levels = {
            'tecnico': ['técnico', 'tecnólogo'],
            'superior': ['bacharelado', 'licenciatura', 'graduação', 'superior'],
            'pos': ['pós', 'especialização', 'mba', 'mestrado', 'doutorado', 'phd']
        }

    def extract_text_from_file(self, file_content: bytes, filename: str) -> str:
        """Extrai texto de diferentes tipos de arquivo"""
        try:
            file_ext = filename.lower().split('.')[-1]
            
            if file_ext == 'txt':
                return file_content.decode('utf-8', errors='ignore')
            
            elif file_ext == 'pdf':
                pdf_file = BytesIO(file_content)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
            
            elif file_ext in ['doc', 'docx']:
                doc_file = BytesIO(file_content)
                doc = docx.Document(doc_file)
                text = ""
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                return text
            
            else:
                return file_content.decode('utf-8', errors='ignore')
                
        except Exception as e:
            # Fallback para texto simples
            return file_content.decode('utf-8', errors='ignore')

    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """Extrai skills técnicas do texto"""
        text_lower = text.lower()
        found_skills = {}
        
        for category, skills in self.skills_database.items():
            found_in_category = []
            for skill in skills:
                # Busca por palavra completa ou com pontuação
                pattern = r'\b' + re.escape(skill.lower()) + r'\b'
                if re.search(pattern, text_lower):
                    found_in_category.append(skill.title())
            
            if found_in_category:
                found_skills[category] = found_in_category
        
        return found_skills

    def calculate_experience_years(self, text: str) -> int:
        """Calcula anos de experiência baseado no texto"""
        # Busca por padrões de data
        date_patterns = [
            r'(\d{4})\s*[-–]\s*(\d{4})',  # 2020-2024
            r'(\d{4})\s*[-–]\s*presente',  # 2020-presente
            r'(\d{4})\s*[-–]\s*atual',     # 2020-atual
            r'(\d{1,2})\s*anos?\s*de\s*experiência',  # X anos de experiência
            r'experiência\s*de\s*(\d{1,2})\s*anos?'   # experiência de X anos
        ]
        
        current_year = datetime.datetime.now().year
        total_experience = 0
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                if isinstance(match, tuple) and len(match) == 2:
                    start_year = int(match[0])
                    if match[1] in ['presente', 'atual']:
                        end_year = current_year
                    else:
                        try:
                            end_year = int(match[1])
                        except:
                            end_year = current_year
                    
                    years = max(0, end_year - start_year)
                    total_experience = max(total_experience, years)
                else:
                    # Padrão de "X anos de experiência"
                    years = int(match)
                    total_experience = max(total_experience, years)
        
        # Se não encontrou padrões específicos, estima baseado em cargos
        if total_experience == 0:
            job_count = len(re.findall(r'(desenvolvedor|analista|gerente|coordenador)', text.lower()))
            total_experience = min(job_count * 2, 10)  # Estima 2 anos por cargo, máximo 10
        
        return min(total_experience, 25)  # Máximo 25 anos

    def determine_seniority(self, text: str, experience_years: int) -> str:
        """Determina nível de senioridade"""
        text_lower = text.lower()
        
        # Pontuação por palavras-chave
        seniority_scores = {'junior': 0, 'pleno': 0, 'senior': 0}
        
        for level, keywords in self.experience_keywords.items():
            for keyword in keywords:
                count = len(re.findall(r'\b' + re.escape(keyword) + r'\b', text_lower))
                seniority_scores[level] += count
        
        # Ajusta baseado na experiência
        if experience_years <= 2:
            seniority_scores['junior'] += 3
        elif experience_years <= 5:
            seniority_scores['pleno'] += 3
        else:
            seniority_scores['senior'] += 3
        
        # Retorna o nível com maior pontuação
        max_level = max(seniority_scores, key=seniority_scores.get)
        
        # Mapeamento para português
        level_map = {
            'junior': 'Junior',
            'pleno': 'Pleno', 
            'senior': 'Senior'
        }
        
        return level_map[max_level]

    def extract_education(self, text: str) -> str:
        """Extrai informações sobre educação"""
        text_lower = text.lower()
        
        education_found = []
        
        for level, keywords in self.education_levels.items():
            for keyword in keywords:
                if keyword in text_lower:
                    education_found.append(level)
                    break
        
        if 'pos' in education_found:
            return 'Pós-graduação'
        elif 'superior' in education_found:
            return 'Ensino Superior'
        elif 'tecnico' in education_found:
            return 'Ensino Técnico'
        else:
            return 'Não informado'

    def calculate_job_compatibility(self, resume_text: str, job_description: str) -> int:
        """Calcula compatibilidade entre currículo e vaga"""
        if not job_description:
            return None
        
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extrai skills de ambos
        resume_skills = self.extract_skills(resume_text)
        job_skills = self.extract_skills(job_description)
        
        # Conta skills em comum
        common_skills = 0
        total_job_skills = 0
        
        for category, skills in job_skills.items():
            total_job_skills += len(skills)
            if category in resume_skills:
                common_skills += len(set(skills) & set(resume_skills[category]))
        
        if total_job_skills == 0:
            return 85  # Compatibilidade padrão se não conseguir extrair skills da vaga
        
        # Calcula porcentagem base
        compatibility = (common_skills / total_job_skills) * 100
        
        # Ajustes baseados em palavras-chave importantes
        important_keywords = re.findall(r'\b\w{4,}\b', job_lower)[:10]  # Top 10 palavras
        keyword_matches = 0
        
        for keyword in important_keywords:
            if keyword in resume_lower:
                keyword_matches += 1
        
        # Bonus por palavras-chave
        keyword_bonus = (keyword_matches / len(important_keywords)) * 20 if important_keywords else 0
        
        final_compatibility = min(95, max(60, compatibility + keyword_bonus))
        return int(final_compatibility)

    def generate_interview_questions(self, skills: Dict[str, List[str]], seniority: str, experience_years: int) -> List[str]:
        """Gera perguntas personalizadas para entrevista"""
        questions = []
        
        # Perguntas baseadas em senioridade
        if seniority == 'Junior':
            questions.extend([
                'Conte sobre algum projeto pessoal ou acadêmico que você desenvolveu',
                'Como você costuma aprender novas tecnologias?',
                'Descreva uma situação onde você teve que resolver um problema técnico'
            ])
        elif seniority == 'Pleno':
            questions.extend([
                'Descreva um projeto complexo que você liderou ou participou ativamente',
                'Como você aborda a revisão de código e mentoria de desenvolvedores junior?',
                'Conte sobre uma vez que você teve que otimizar performance de uma aplicação'
            ])
        else:  # Senior
            questions.extend([
                'Como você define a arquitetura de um novo sistema?',
                'Descreva sua experiência liderando equipes técnicas',
                'Como você toma decisões sobre escolha de tecnologias em um projeto?'
            ])
        
        # Perguntas baseadas em skills específicas
        if 'programming' in skills:
            questions.append('Explique as melhores práticas de desenvolvimento que você segue')
        
        if 'cloud_devops' in skills:
            questions.append('Descreva sua experiência com deploy e infraestrutura em nuvem')
        
        if 'data_science' in skills:
            questions.append('Como você aborda um novo problema de análise de dados?')
        
        # Perguntas gerais importantes
        general_questions = [
            'Como você lida com prazos apertados e pressão?',
            'Conte sobre um erro que você cometeu e como aprendeu com ele',
            'Como você se mantém atualizado com as tendências da sua área?',
            'Descreva uma situação onde você teve que trabalhar em equipe para resolver um problema complexo'
        ]
        
        questions.extend(general_questions[:2])  # Adiciona 2 perguntas gerais
        
        return questions[:5]  # Retorna máximo 5 perguntas

    def generate_strengths(self, skills: Dict[str, List[str]], experience_years: int, education: str) -> List[str]:
        """Gera pontos fortes baseados na análise"""
        strengths = []
        
        # Baseado em skills
        if len(skills) >= 3:
            strengths.append('Amplo conhecimento técnico em múltiplas áreas')
        
        if 'programming' in skills and len(skills['programming']) >= 3:
            strengths.append('Sólida experiência em linguagens de programação')
        
        if 'cloud_devops' in skills:
            strengths.append('Conhecimento em infraestrutura e DevOps')
        
        if 'methodologies' in skills:
            strengths.append('Experiência com metodologias ágeis')
        
        # Baseado em experiência
        if experience_years >= 5:
            strengths.append('Experiência profissional sólida e consistente')
        
        if experience_years >= 8:
            strengths.append('Perfil sênior com capacidade de liderança')
        
        # Baseado em educação
        if education in ['Ensino Superior', 'Pós-graduação']:
            strengths.append('Boa formação acadêmica')
        
        # Pontos fortes gerais
        general_strengths = [
            'Capacidade de adaptação a novas tecnologias',
            'Histórico profissional progressivo',
            'Perfil técnico alinhado com demandas do mercado'
        ]
        
        strengths.extend(general_strengths[:2])
        
        return strengths[:5]  # Máximo 5 pontos fortes

    def calculate_overall_score(self, skills: Dict[str, List[str]], experience_years: int, 
                              education: str, seniority: str) -> int:
        """Calcula pontuação geral do candidato"""
        score = 50  # Base
        
        # Pontos por skills (máximo 25 pontos)
        total_skills = sum(len(skill_list) for skill_list in skills.values())
        skill_points = min(25, total_skills * 2)
        score += skill_points
        
        # Pontos por experiência (máximo 20 pontos)
        experience_points = min(20, experience_years * 2)
        score += experience_points
        
        # Pontos por educação (máximo 10 pontos)
        education_points = {
            'Pós-graduação': 10,
            'Ensino Superior': 8,
            'Ensino Técnico': 5,
            'Não informado': 0
        }
        score += education_points.get(education, 0)
        
        # Pontos por senioridade (máximo 10 pontos)
        seniority_points = {
            'Senior': 10,
            'Pleno': 7,
            'Junior': 5
        }
        score += seniority_points.get(seniority, 5)
        
        return min(95, max(60, score))  # Entre 60 e 95

    def analyze_resume(self, file_content: bytes, filename: str, job_description: str = None) -> Dict:
        """Análise completa do currículo"""
        try:
            # Extrai texto do arquivo
            text = self.extract_text_from_file(file_content, filename)
            
            if not text.strip():
                raise ValueError("Não foi possível extrair texto do arquivo")
            
            # Análises individuais
            skills = self.extract_skills(text)
            experience_years = self.calculate_experience_years(text)
            seniority = self.determine_seniority(text, experience_years)
            education = self.extract_education(text)
            
            # Pontuação geral
            overall_score = self.calculate_overall_score(skills, experience_years, education, seniority)
            
            # Compatibilidade com vaga
            job_compatibility = None
            if job_description:
                job_compatibility = self.calculate_job_compatibility(text, job_description)
            
            # Perguntas para entrevista
            interview_questions = self.generate_interview_questions(skills, seniority, experience_years)
            
            # Pontos fortes
            strengths = self.generate_strengths(skills, experience_years, education)
            
            # Resumo executivo
            summary = self.generate_executive_summary(overall_score, seniority, experience_years, skills)
            
            # Recomendação
            recommendation = self.generate_recommendation(overall_score, job_compatibility)
            
            # Flatten skills para resposta
            all_skills = []
            for category, skill_list in skills.items():
                all_skills.extend(skill_list)
            
            return {
                'pontuacao_geral': overall_score,
                'experiencia_anos': experience_years,
                'nivel_senioridade': seniority,
                'educacao': education,
                'compatibilidade_vaga': job_compatibility,
                'pontos_fortes': strengths,
                'skills_tecnicas': all_skills[:10],  # Top 10 skills
                'skills_por_categoria': skills,
                'perguntas_entrevista': interview_questions,
                'resumo': summary,
                'recomendacao': recommendation,
                'processado_em': datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Erro na análise: {str(e)}")

    def generate_executive_summary(self, score: int, seniority: str, experience_years: int, 
                                 skills: Dict[str, List[str]]) -> str:
        """Gera resumo executivo do candidato"""
        skill_count = sum(len(skill_list) for skill_list in skills.values())
        
        if score >= 85:
            quality = "excelente"
        elif score >= 75:
            quality = "boa"
        else:
            quality = "adequada"
        
        summary = f"Candidato com perfil {seniority.lower()} e {experience_years} anos de experiência. "
        summary += f"Apresenta {quality} qualificação técnica com {skill_count} competências identificadas. "
        
        if score >= 80:
            summary += "Altamente recomendado para processo seletivo."
        elif score >= 70:
            summary += "Recomendado para entrevista."
        else:
            summary += "Candidato a ser considerado com ressalvas."
        
        return summary

    def generate_recommendation(self, score: int, job_compatibility: int = None) -> str:
        """Gera recomendação final"""
        if job_compatibility:
            if job_compatibility >= 85 and score >= 80:
                return "Altamente recomendado - Excelente fit para a vaga"
            elif job_compatibility >= 75 and score >= 70:
                return "Recomendado - Bom fit para a vaga"
            elif job_compatibility >= 65:
                return "Considerar - Fit parcial para a vaga"
            else:
                return "Não recomendado - Baixo fit para a vaga"
        else:
            if score >= 85:
                return "Altamente recomendado para entrevista"
            elif score >= 75:
                return "Recomendado para entrevista"
            elif score >= 65:
                return "Considerar para entrevista"
            else:
                return "Não recomendado"



    def avaliar_curriculo_com_parecer(self, texto: str) -> dict:
        """Gera nota de 0 a 10 e um parecer explicativo sobre o currículo analisado."""
        score = 0
        parecer = []

        texto_lower = texto.lower()
        habilidades = sum(texto_lower.count(skill) for group in self.skills_database.values() for skill in group)
        if habilidades >= 10:
            score += 4
            parecer.append("Possui várias habilidades técnicas relevantes.")
        elif habilidades >= 5:
            score += 2.5
            parecer.append("Possui algumas habilidades técnicas, mas pode aprofundar.")
        else:
            score += 1
            parecer.append("Poucas habilidades técnicas identificadas.")

        if "experiência" in texto_lower or "trabalhei" in texto_lower or "emprego" in texto_lower:
            score += 2
            parecer.append("Apresenta histórico de experiência profissional.")
        else:
            parecer.append("Não apresenta experiência profissional clara.")

        if len(texto.split()) > 200:
            score += 2
            parecer.append("Currículo tem bom volume de conteúdo.")
        else:
            score += 0.5
            parecer.append("Currículo curto, poderia ser mais detalhado.")

        if re.search(r"\b[a-z]{3,}\s+[a-z]{3,}\b", texto):
            score += 1
            parecer.append("Texto bem estruturado.")
        else:
            parecer.append("Texto com estrutura fraca.")

        score = min(round(score, 1), 10.0)
        return {
            "nota": score,
            "parecer": "Nota: {:.1f} — {}".format(score, " ".join(parecer))
        }
