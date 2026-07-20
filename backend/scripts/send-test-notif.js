const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Insert three sample notifications representing different types to match the user's design image:
  const samples = [
    {
      title: 'Votre commande #12345 a été livrée ✅',
      body: 'Votre commande chez Snack Al Baraka a été livrée avec succès.',
      target: 'all',
      sent_by: 'system_test',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    },
    {
      title: '🔥 30% de réduction sur Pizza Palace',
      body: 'Profitez de notre offre spéciale ce week-end sur toutes les pizzas.',
      target: 'all',
      sent_by: 'system_test',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hr ago
    },
    {
      title: 'Mise à jour des conditions d\'utilisation 📄',
      body: 'Nous avons mis à jour nos conditions de service et notre politique de confidentialité.',
      target: 'all',
      sent_by: 'system_test',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    }
  ];

  for (const sample of samples) {
    const { data, error } = await supabase
      .from('notifications_log')
      .insert(sample)
      .select()
      .single();

    if (error) {
      console.error('Error inserting notification:', error.message);
    } else {
      console.log('Created notification:', data.title);
    }
  }
}

run();
