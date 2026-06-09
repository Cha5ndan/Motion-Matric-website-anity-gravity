const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  try {
    // Parse slug from query or path
    let slug = req.query.slug;
    
    if (!slug) {
      const urlParts = req.url.split('?')[0].split('/');
      // Expected path: /blog/slug-name
      slug = urlParts[urlParts.length - 1];
    }
    
    // If slug is empty or is "index.html" or "post.html", redirect to blog list
    if (!slug || slug === 'index.html' || slug === 'post.html' || slug === 'blog') {
      res.writeHead(302, { Location: '/blog' });
      res.end();
      return;
    }

    // Fetch blog post from Supabase
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .single();

    if (error || !post) {
      console.error('Supabase fetch error or post not found:', error);
      // Serve a custom 404 page or redirect to blog listing
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.write('<h1>404 - Blog Post Not Found</h1><p>The requested blog post could not be found. <a href="/blog">Back to blog index</a></p>');
      res.end();
      return;
    }

    // Read the static template HTML file
    const templatePath = path.join(process.cwd(), 'blog', 'post.html');
    
    if (!fs.existsSync(templatePath)) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.write('<h1>500 - Server Template Error</h1><p>Required blog template is missing from the server.</p>');
      res.end();
      return;
    }

    let html = fs.readFileSync(templatePath, 'utf8');

    // Generate plain-text snippet for meta description if not provided
    let excerpt = post.meta_description || '';
    if (!excerpt) {
      excerpt = post.content
        .replace(/<[^>]*>/g, '') // strip HTML tags
        .substring(0, 160) + '...';
    }

    // Format publish date
    const publishDate = new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const categoryName = post.categories ? post.categories.name : 'Uncategorized';
    const categorySlug = post.categories ? post.categories.slug : 'uncategorized';
    const featuredImage = post.featured_image || 'https://motionmatrix.studio/assets/og-cover.png';
    const canonicalUrl = `https://motionmatrix.studio/blog/${post.slug}`;

    // Create JSON-LD Schema markup for the Article
    const schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "image": featuredImage,
      "datePublished": post.published_at || post.created_at,
      "dateModified": post.published_at || post.created_at,
      "author": {
        "@type": "Person",
        "name": post.author_name
      },
      "publisher": {
        "@type": "Organization",
        "name": "Motion Matrix",
        "logo": {
          "@type": "ImageObject",
          "url": "https://motionmatrix.studio/assets/logo.png"
        }
      },
      "description": excerpt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      }
    };

    // Replace the SEO placeholders in the template
    html = html.replace(/{{META_TITLE}}/g, post.meta_title || post.title + ' | Motion Matrix Blog');
    html = html.replace(/{{META_DESCRIPTION}}/g, excerpt);
    html = html.replace(/{{CANONICAL_URL}}/g, canonicalUrl);
    html = html.replace(/{{FEATURED_IMAGE}}/g, featuredImage);
    
    // Replace the Content placeholders
    html = html.replace(/{{TITLE}}/g, post.title);
    html = html.replace(/{{CONTENT}}/g, post.content);
    html = html.replace(/{{AUTHOR}}/g, post.author_name);
    html = html.replace(/{{DATE}}/g, publishDate);
    html = html.replace(/{{CATEGORY_NAME}}/g, categoryName);
    html = html.replace(/{{CATEGORY_SLUG}}/g, categorySlug);
    
    // Inject the structured data schema
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schemaMarkup)}</script>\n</head>`);

    // Return the pre-rendered HTML
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.write(html);
    res.end();

  } catch (err) {
    console.error('Server error rendering blog post:', err);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.write('<h1>500 - Internal Server Error</h1><p>Something went wrong on the server.</p>');
    res.end();
  }
};
